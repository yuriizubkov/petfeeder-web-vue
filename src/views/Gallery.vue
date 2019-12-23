<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col class="pl-1 pr-1 pt-0" cols="12" md="8">
        <v-card :disabled="loadingDbDates || loadingGallery" :loading="loadingDbDates">
          <v-container class="pb-0">
            <v-row>
              <v-col class="pb-0">
                <v-select dense label="Year" :items="years" v-model="yearSelected" />
              </v-col>
              <v-col class="pb-0">
                <v-select dense label="Month" :items="months" v-model="monthSelected" />
              </v-col>
              <v-col class="pb-0">
                <v-select dense label="Date (UTC)" :items="dates" v-model="dateSelected" />
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="loadingGallery" align="center" justify="center">
      <v-col cols="6" class="text-center">
        <v-progress-circular :size="70" :width="7" indeterminate />
      </v-col>
    </v-row>
    <v-row v-else align="center" justify="center">
      <v-col class="pl-1 pr-1 pt-0" cols="12" md="8">
        <v-list dense v-if="galleryList && galleryList.length > 0" subheader>
          <v-list-item class="pl-1" v-for="(item, index) in galleryList" :key="index">
            <v-list-item-avatar class="pa-0 mr-0">
              <v-icon>mdi-video-vintage</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{item.id}}</v-list-item-title>
              <v-list-item-subtitle>{{ getDateString(item) }} (GMT {{ -timezoneOffset >= 0 ? '+' : '-' }}{{ -timezoneOffset }})</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <div
          class="text-center"
          v-if="!loadingGallery && (!galleryList || galleryList.length === 0)"
        >So quiet here...</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import { nf } from '../utilities/helpers'

export default {
  data: () => {
    const currentDate = new Date()
    return {
      todayDate: currentDate,
      yearSelected: currentDate.getUTCFullYear(),
      monthSelected: currentDate.getUTCMonth() + 1,
      dateSelected: currentDate.getUTCDate(),
      timezoneOffset: new Date().getTimezoneOffset() / 60,
      loadingGallery: true,
      loadingDbDates: true,
    }
  },
  watch: {
    dateSelected: async function() {
      await this.getGallery(this.yearSelected, this.monthSelected, this.dateSelected)
    },
  },
  computed: {
    ...mapState(['galleryList', 'galleryDates']),
    years() {
      if (!this.galleryDates || Object.keys(this.galleryDates).length === 0)
        return [{ text: this.yearSelected, value: this.yearSelected }]
      else
        return Object.keys(this.galleryDates).map(key => {
          return { text: key, value: parseInt(key) }
        })
    },
    months() {
      if (!this.galleryDates[this.yearSelected]) return [{ text: nf(this.monthSelected), value: this.monthSelected }]
      else
        return Object.keys(this.galleryDates[this.yearSelected]).map(key => {
          return { text: nf(key), value: parseInt(key) }
        })
    },
    dates() {
      if (!this.galleryDates[this.yearSelected] || !this.galleryDates[this.yearSelected][this.monthSelected])
        return [{ text: nf(this.dateSelected), value: this.dateSelected }]
      else
        return Object.keys(this.galleryDates[this.yearSelected][this.monthSelected]).map(key => {
          return {
            text: `${nf(key)} (${this.galleryDates[this.yearSelected][this.monthSelected][key]} videos)`,
            value: parseInt(key),
          }
        })
    },
  },
  methods: {
    nf,
    ...mapMutations(['setGallery', 'setTitle']),
    ...mapActions(['showSnackbar']),
    getDateString(item) {
      const date = new Date(item.id)
      return `${date.getFullYear()}.${nf(date.getMonth() + 1)}.${nf(date.getDate())} ${nf(date.getHours())}:${nf(
        date.getMinutes()
      )}:${nf(date.getSeconds())}`
    },
    async getGallery(year, month, date) {
      this.loadingGallery = true

      try {
        this.$store.commit('setGallery', [])
        await this.$store.dispatch('getGallery', { year, month, date })
      } catch (err) {
        console.error('getGallery error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.loadingGallery = false
    },
    async getGalleryDates() {
      this.loadingDbDates = true

      try {
        await this.$store.dispatch('getGalleryDates')
      } catch (err) {
        console.error('getGalleryDates error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.loadingDbDates = false
    },
  },
  created: function() {
    this.setTitle('Gallery')
    this.getGallery(this.yearSelected, this.monthSelected, this.dateSelected)
    this.getGalleryDates()
  },
}
</script>
