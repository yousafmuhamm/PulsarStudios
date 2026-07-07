import { basePage } from './base.js';
import { createHomePage } from './home.js';
import { createAboutPage } from './about.js';
import { createProjectsPage } from './projects.js';
import { createProjectPage } from './project.js';

const MAP = {
  home: createHomePage,
  about: createAboutPage,
  projects: createProjectsPage,
  project: createProjectPage,
};

export function makePage(main) {
  const factory = MAP[main.dataset.page] || basePage;
  return factory(main);
}
