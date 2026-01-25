import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import { createApp } from 'vue'
import { createVfm, useVfm, VueFinalModal } from 'vue-final-modal'
// Suppress React warnings from external libraries
import '@/lib/reactWarningFilter'

import '@/assets/styles/buttons.css'
import '@/assets/styles/dialogs.css'
import '@/assets/styles/messages.css'
import '@/assets/styles/multiselect.css'
import '@/assets/styles/tables.css'
import '@/assets/styles/tooltips.css'
import '@/assets/styles/typography.css'
import '@/assets/styles/variables.css'
import 'vue-final-modal/style.css'
import 'vue-multiselect/dist/vue-multiselect.css'

const app = createApp(App)
  .use(router)
  .use(store)
  .use(createVfm())
  .component('modal', VueFinalModal)

const vfm = useVfm()
app.config.globalProperties.$modal = {
  show: modalId => vfm.open(modalId),
  hide: modalId => vfm.close(modalId)
}
app.mount('#app')
