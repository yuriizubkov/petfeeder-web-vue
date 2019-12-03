<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col class="pl-1 pr-1 pt-0" cols="12" md="8">
        <v-card :disabled="loadingDbDates || loadingEvents" :loading="loadingDbDates">
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
    <v-row v-if="loadingEvents" align="center" justify="center">
      <v-col cols="6" class="text-center">
        <v-progress-circular :size="70" :width="7" indeterminate />
      </v-col>
    </v-row>
    <v-row v-else align="center" justify="center">
      <v-col class="pl-1 pr-1 pt-0" cols="12" md="8">
        <v-list dense v-if="eventList && eventList.length > 0" subheader>
          <v-list-item class="pl-1" v-for="(item, index) in eventList" :key="index">
            <v-list-item-avatar class="pa-0 mr-0">
              <v-icon v-text="getIconClass(item)"></v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-text="getFriendlyType(item)"></v-list-item-title>
              <v-list-item-subtitle>{{ getDateString(item) }} (GMT {{ -timezoneOffset >= 0 ? '+' : '-' }}{{ -timezoneOffset }})</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <div
          class="text-center"
          v-if="!loadingEvents && (!eventList || eventList.length === 0)"
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
      loadingEvents: true,
      loadingDbDates: true,
    }
  },
  watch: {
    dateSelected: async function() {
      await this.getEvents(this.yearSelected, this.monthSelected, this.dateSelected)
    },
  },
  computed: {
    ...mapState(['eventList', 'allDbDates']),
    years() {
      if (!this.allDbDates || Object.keys(this.allDbDates).length === 0)
        return [{ text: this.yearSelected, value: this.yearSelected }]
      else
        return Object.keys(this.allDbDates).map(key => {
          return { text: key, value: parseInt(key) }
        })
    },
    months() {
      if (!this.allDbDates[this.yearSelected]) return [{ text: nf(this.monthSelected), value: this.monthSelected }]
      else
        return Object.keys(this.allDbDates[this.yearSelected]).map(key => {
          return { text: nf(key), value: parseInt(key) }
        })
    },
    dates() {
      if (!this.allDbDates[this.yearSelected] || !this.allDbDates[this.yearSelected][this.monthSelected])
        return [{ text: nf(this.dateSelected), value: this.dateSelected }]
      else
        return Object.keys(this.allDbDates[this.yearSelected][this.monthSelected]).map(key => {
          return {
            text: `${nf(key)} (${this.allDbDates[this.yearSelected][this.monthSelected][key].events} events)`,
            value: parseInt(key),
          }
        })
    },
  },
  methods: {
    nf,
    ...mapMutations(['setEvents', 'setTitle']),
    ...mapActions(['showSnackbar']),
    getIconClass(item) {
      let cssClass
      switch (item.type) {
        case 'feeding':
          cssClass = 'mdi-food'
          break
        case 'clocksync':
          cssClass = 'mdi-clock'
          break
        case 'warning':
          cssClass = 'mdi-alert'
          break
      }

      return cssClass
    },
    getFriendlyType(item) {
      let friendlyType = item.type
      switch (item.type) {
        case 'feeding':
          friendlyType = `Feeding. Issued portions: ${item.data.issuedPortions}, ${
            item.data.scheduled ? 'Auto' : 'Manual'
          }${item.data.issuedPortions < item.data.scheduledPortions ? '. Motor stuck!' : ''}`
          break
        case 'clocksync':
          friendlyType = 'Clock synchronization'
          break
        case 'warning':
          switch (item.data.type) {
            case 'nofood':
              friendlyType = 'Warning. No food left!'
              break
            default:
              friendlyType = JSON.stringify(item)
              break
          }
          break
        default:
          friendlyType = JSON.stringify(item)
          break
      }

      return friendlyType
    },
    getDateString(item) {
      const date = new Date(item.timestamp)
      return `${date.getFullYear()}.${nf(date.getMonth() + 1)}.${nf(date.getDate())} ${nf(date.getHours())}:${nf(
        date.getMinutes()
      )}:${nf(date.getSeconds())}`
    },
    async getEvents(year, month, date) {
      this.loadingEvents = true

      try {
        this.$store.commit('setEvents', [])
        await this.$store.dispatch('getEvents', { year, month, date })
        this.loadingEvents = false
      } catch (err) {
        console.error('getEvents error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.loadingEvents = false
    },
    async getAllDbDates() {
      this.loadingDbDates = true

      try {
        await this.$store.dispatch('getAllDbDates')
      } catch (err) {
        this.loadingEvents = false
        console.error('getAllDbDates error:', err)
        this.$store.dispatch('showSnackbar', {
          text: err,
          timeout: 10000,
        })
      }

      this.loadingDbDates = false
    },
  },
  created: async function() {
    this.setTitle('Events')
    await this.getEvents(this.yearSelected, this.monthSelected, this.dateSelected)
    await this.getAllDbDates()
  },
}
</script>
