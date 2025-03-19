import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { mdiMagnify, mdiSort, mdiFilter, mdiOpenInNew } from '@mdi/js';

export default createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases: {
        ...aliases,
        search: mdiMagnify,
        sort: mdiSort,
        filter: mdiFilter,
        link: mdiOpenInNew,
      },
      sets: {
        mdi,
      },
    },
});
