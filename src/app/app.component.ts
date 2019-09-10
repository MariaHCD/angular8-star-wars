import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
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
    topSpecies: [],
    topPilotProvider: null
  };
  isLoading: boolean;
  films = [];

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Function that executes when the button is clicked
   */
  async submit() {
    this.isLoading = true;
    this.films = (await this.sendRequest(this.apiUrl + 'films')).results;
    this.getFilmStatistics();
    this.getPlanetStatistics();
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
    this.result.mostCharacterAppearances = (await this.sendRequest(Object.keys(characterMap).reduce(
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
        name: (await this.sendRequest(species.url)).name,
        number_of_appearances: species.count
      });
    });
  }

  /**
   * Determine the planet that provided the largest number of vehicle pilots
   */
  async getPlanetStatistics() {
    const planetMap = {};
    let page = 1;

    while (page !== null) {
      const response = await this.sendRequest(this.apiUrl + 'people?page=' + page);
      response.results.forEach(async (person) => {
        if (person.vehicles.length === 0) {
          return;
        }
        const homeworld = (await this.sendRequest(person.homeworld));
        const species = (await this.sendRequest(person.species[0])).name;
        if (planetMap[homeworld.url]) {
          ++planetMap[homeworld.url].number_of_pilots;
          if (!planetMap[homeworld.url].pilots.filter(p => p.name === person.name).length) {
            planetMap[homeworld.url].pilots.push({
              name: person.name,
              species
            });
          }
        } else {
          planetMap[homeworld.url] = {
            planet: homeworld.name,
            number_of_pilots: 1,
            pilots: [
              {
                name: person.name,
                species
              }
            ]
          };
        }
      });
      page = response.next ? ++page : null;
    }

    const planets = Object.values(planetMap);
    this.result.topPilotProvider = planets.reduce((a: any, b: any) => a.number_of_pilots > b.number_of_pilots ? a : b);
    this.isLoading = false;
  }

  /**
   * Send an API GET request to fetch data
   * @param url The url of the GET request
   */
  async sendRequest(url: string): Promise<any> {
    return await this.http.get(url).toPromise();
  }

}
