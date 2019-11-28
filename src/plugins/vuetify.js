import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import 'typeface-roboto/index.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
})
