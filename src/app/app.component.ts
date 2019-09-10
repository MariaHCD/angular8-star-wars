import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Angular2SwapiService } from 'angular2-swapi';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  apiUrl = environment.api_url;
  result = {
    longestCrawl: '',
    mostCharacterAppearances: '',
    topSpecies: []
  };
  isLoading: boolean;
  films = [];

  constructor(
    private http: HttpClient,
    private swapi: Angular2SwapiService
  ) { }

  /**
   * Function that executes when the button is clicked
   */
  submit() {
    this.isLoading = true;

    this.swapi.getFilms().toPromise().then(
      (films) => {
        this.films = films;
      }
    ).then(() => {
      this.getFilmStatistics();
      this.isLoading = false;
    });
  }

  /**
   * Calculate film statistics
   */
  async getFilmStatistics() {
    let maxLength = 0;
    const characterMap = {};
    const speciesMap = [];
    this.films.forEach((film: any) => {

      // Track the film with longest opening crawl
      const length = film.opening_crawl.length;
      if (length > maxLength) {
        maxLength = length;
        this.result.longestCrawl = film.title;
      }

      // Track each character's appearance in the film
      film.characters.forEach((character: string) => {
        characterMap[character] = characterMap.hasOwnProperty(character) ? ++characterMap[character] : 1;
      });

      // Track the appearance of each species in the film
      film.species.forEach((species: string) => {
        const existing = speciesMap.filter((s) => s.url === species)[0];
        if (existing) {
          ++existing.count;
        } else {
          speciesMap.push({
            url: species,
            count: 1
          });
        }
      });
    });

    this.getMostCharacterAppearances(characterMap);
    this.getMostSpeciesAppearances(speciesMap);
  }

  /**
   * Determine the character with the most number of film appearances
   * @param characterMap object with format { url: count_of_appearances }
   */
  async getMostCharacterAppearances(characterMap: any) {
    this.result.mostCharacterAppearances = (await this.getItem(Object.keys(characterMap).reduce(
      (a, b) => characterMap[a] > characterMap[b]
        ? a : b))).name;
  }

  /**
   * Determine the species with the most number of film appearances
   * @param speciesMap array containing each species url and appearance count
   */
  getMostSpeciesAppearances(speciesMap: any) {
    speciesMap.sort((a, b) => (a.count < b.count) ? 1 : -1);

    speciesMap.slice(0, 3).forEach(async (species) => {
      this.result.topSpecies.push({
        name: (await this.getItem(species.url)).name,
        number_of_appearances: species.count
      });
    });
  }

  /**
   * Send an API GET request to fetch an item
   * @param url The url of the GET request
   */
  async getItem(url: string): Promise<any> {
    return await this.http.get(url).toPromise();
  }

}
