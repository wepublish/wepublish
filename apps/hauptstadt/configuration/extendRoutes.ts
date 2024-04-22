import {NuxtRouteConfig} from '@nuxt/types/config/router'

const extendRoutes: NuxtRouteConfig[] = [
  {
    path: '/a/:articleId/:articleSlug',
    redirect: '/a/:articleSlug'
  },
  {
    path: '/p/:pageId/:pageSlug',
    redirect: '/p/:pageSlug'
  },
  // login
  {
    path: '/login',
    redirect: '/p/login'
  },
  // abo
  {
    path: '/abo',
    redirect: '/p/abo'
  },
  {
    path: '/geschenkabo',
    redirect: '/p/geschenkabo'
  },
  // hotfix not working api login link
  {
    path: '/login/:key',
    redirect: '/p/login?:key'
  },
  {
    path: '/l/etikette',
    redirect: '/p/unsere-etikette'
  },
  // backwards compatibility for pages and articles because of https://hauptstadt.atlassian.net/browse/HA-82
  // articles
  {
    path: '/article/:articleSlug',
    redirect: '/a/:articleSlug'
  },
  {
    path: '/page/:pageSlug',
    redirect: '/p/:pageSlug'
  },
  // nice links for print magazine 2024
  {
    path: '/l/auftakt',
    redirect: '/a/geld-und-geist-one'
  },
  {
    path: '/l/burgerbesitz',
    redirect: '/a/geld-und-geist-two'
  },
  {
    path: '/l/muehlheim',
    redirect: '/a/interview-barbara-muehlheim-burgergemeinde-bern'
  },
  {
    path: '/l/burgerfinanzen',
    redirect: '/a/gute-rendite-wenig-klimaschutz '
  },
  {
    path: '/l/burgerpolitik',
    redirect: '/a/burgergemeinde-in-der-politik'
  },
  {
    path: '/l/kulturburger',
    redirect: '/a/kulturburger '
  },
  {
    path: '/l/burgerwald',
    redirect: '/a/wald-burgergemeinde-bern-holz-klima-wandel-biodiversitaet-wirtschaft '
  },
  {
    path: '/l/zuenfte',
    redirect: '/a/zuenfte'
  },
  {
    path: '/l/einburgern',
    redirect: '/a/einburgern-burgergemeinde'
  },
  {
    path: '/l/burgerzukunft',
    redirect: '/a/vorschlaege-zukunft-burgergemeinde-bern'
  },

  // nice links for print magazine 2023
  {
    path: '/l/liechti',
    redirect: '/a/portraet-schauspieler-manfred-liechti-spielt-kneubuehl'
  },
  {
    path: '/l/kmu',
    redirect: '/a/kleiner-machtloser-unternehmer'
  },
  {
    path: '/l/keramik',
    redirect: '/a/portraetkolumne-eva-vogelsang'
  },
  {
    path: '/l/nachtleben',
    redirect: '/a/nachtleben'
  },
  {
    path: '/l/vercetti',
    redirect: '/a/interview-geld-tommy-vercetti'
  },
  {
    path: '/l/lebenshof',
    redirect: '/a/burrens-wollen-nicht-mehr-metzgen-lebenshof-liebewil-koeniz'
  },

  // nice links for print magazine 2022
  {
    path: '/l/downtown',
    redirect: '/a/harrys-home-ostermundigen'
  },
  {
    path: '/l/lehrplan',
    redirect: '/a/aufklarungsunterricht'
  },
  {
    path: '/l/1000grad',
    redirect: '/a/ziegelei-rapperswil-ist-auf-russisches-gas-angewiesen'
  },
  {
    path: '/l/ruecken',
    redirect: '/a/fragen-aus-dem-bern-movement-lab'
  },
  {
    path: '/l/klima',
    redirect: '/a/kultur-und-klima'
  },
  {
    path: '/l/kulturklima',
    redirect: '/a/kultur-und-klima'
  },
  {
    path: '/l/klimakultur',
    redirect: '/a/kultur-und-klima'
  },
  {
    path: '/l/prixgaranti',
    redirect: '/a/phanomen-prix-garanti'
  }
]

export default extendRoutes
