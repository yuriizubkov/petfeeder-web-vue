import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'
let settings = {}
if (process.env.NODE_ENV !== 'development') {
  settings = require('../../public/settings.json')
} else {
  settings = require('../../settings_development.json')
}

const RPC_TIMEOUT_MS = 10000

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    title: 'Smart Pet Feeder',
    connected: false,
    connectionStateString: 'Connecting...',
    eventList: [],
    galleryList: [],
    galleryDates: {},
    eventDates: {},
    schedule: [],
    snackbar: {
      snackbar: false,
      text: '',
      timeout: 3000,
    },
  },
  mutations: {
    setConnectionState(state, isConnected) {
      state.connected = isConnected
    },
    setConnectionStateStr(state, str) {
      state.connectionStateString = str
    },
    setSchedule(state, schedule) {
      state.schedule = schedule
    },
    setEvents(state, events) {
      state.eventList = events
    },
    setGallery(state, gallery) {
      state.galleryList = gallery
    },
    setSnackbar(state, config) {
      state.snackbar = config
    },
    setTitle(state, title) {
      state.title = title
    },
    setGalleryDates(state, dates) {
      state.galleryDates = dates
    },
    setEventDates(state, dates) {
      state.eventDates = dates
    },
  },
  actions: {
    getSchedule(context) {
      return context
        .dispatch('rpc', {
          method: 'device/getSchedule',
        })
        .then(schedule => {
          context.commit('setSchedule', schedule)
        }) // Returns Promise, so we can handle .catch in desired Vue component in order to show error message
    },
    getEvents(context, date) {
      return context
        .dispatch('rpc', {
          method: 'database/getEvents',
          args: [date.year, date.month, date.date],
        })
        .then(events => {
          context.commit('setEvents', events)
          return events
        })
    },
    getGallery(context, date) {
      return context
        .dispatch('rpc', {
          method: 'database/getGallery',
          args: [date.year, date.month, date.date],
        })
        .then(events => {
          context.commit('setGallery', events)
          return events
        })
    },
    getGalleryDates(context) {
      return context
        .dispatch('rpc', {
          method: 'database/getGalleryDates',
        })
        .then(dates => {
          context.commit('setGalleryDates', dates)
          return dates
        })
    },
    getThumbs(context, entryId) {
      return context.dispatch('rpc', {
        method: 'database/getVideoThumbs',
        args: [entryId],
      })
    },
    getEventDates(context) {
      return context
        .dispatch('rpc', {
          method: 'database/getEventDates',
        })
        .then(dates => {
          context.commit('setEventDates', dates)
          return dates
        })
    },
    setScheduleEntry(context, scheduleEntry) {
      return context.dispatch('rpc', {
        method: 'device/setScheduleEntry',
        args: [
          // we need to pass this arguments in particular order (see petwant-device setScheduleEntry method)
          scheduleEntry.hours,
          scheduleEntry.minutes,
          scheduleEntry.portions,
          scheduleEntry.entryIndex,
          scheduleEntry.soundIndex,
          scheduleEntry.enabled,
        ],
      })
    },
    feedManually(context) {
      return context.dispatch('rpc', {
        method: 'device/feedManually',
      })
    },
    startVideo(context) {
      return context.dispatch('rpc', {
        method: 'camera/startVideoStream',
      })
    },
    stopVideo(context) {
      return context.dispatch('rpc', {
        method: 'camera/stopVideoStream',
      })
    },
    takePicture(context) {
      return context.dispatch('rpc', {
        method: 'camera/takePicture',
      })
    },
    getVideoFile(context, fileId) {
      return context.dispatch('rpc', {
        method: 'files/getVideoFile',
        args: [fileId],
      })
    },
    removeGalleryEntry(context, entryId) {
      return context.dispatch('rpc', {
        method: 'database/removeGalleryEntry',
        args: [entryId],
      })
    },
    rpc(context, request) {
      return new Promise((resolve, reject) => {
        request.args = request.args || []
        const requestId = Date.now() + Math.random() // timestamp + random number (rpc calls could be at the same time)
        request.id = requestId

        // RPC response handler
        const onResponse = response => {
          if (response.id !== requestId) return
          clearTimeout(timeout)
          console.info(`RPC response <-:`, response)
          socket.off('response', onResponse)
          if (!response) return
          if (response.error) reject(response.error)
          else resolve(response.data)
        }

        // RPC timeout
        const timeout = setTimeout(() => {
          socket.off('response', onResponse)
          console.error('RPC timeout', request)
          reject('Remote procedure call timeout')
        }, RPC_TIMEOUT_MS)

        socket.on('response', onResponse)

        // sending RPC request
        console.info(`RPC request ->:`, request)
        socket.emit('request', request) // rpc request
      })
    },
    showSnackbar(context, message) {
      // overriding defaults
      const config = Object.assign(
        {
          snackbar: true,
          text: 'Message text',
          timeout: 5000,
        },
        message
      )

      context.commit('setSnackbar', config)
    },
  },
  modules: {},
})

const socket = io(`http://${process.env.NODE_ENV === 'development' ? settings.ip : ''}:${settings.port}`, {
  path: settings.path,
  transports: ['websocket'],
})

socket.on('connect', () => {
  store.commit('setConnectionState', true)
  store.commit('setConnectionStateStr', 'Connected')
  console.info('Connection state:', 'Connected')
})

socket.on('disconnect', () => {
  store.commit('setConnectionState', false)
  store.commit('setConnectionStateStr', 'Disconnected')
  console.info('Connection state:', 'Disconnected')
})

socket.on('reconnecting', n => {
  store.commit('setConnectionState', false)
  store.commit('setConnectionStateStr', `Trying to reconnect (${n})`)
  console.info('Connection state:', 'Reconnecting...', n)
})

socket.on('reconnect_failed', () => {
  store.commit('setConnectionState', false)
  store.commit('setConnectionStateStr', `Reconnection failed`)
  console.error('Connection state:', 'Reconnection failed')
})

socket.on('connect_error', err => {
  store.commit('setConnectionState', false)
  store.commit('setConnectionStateStr', `Connection error: ${err.message}`)
  console.error('Connection error:', err)
})

/* Notifications */
socket.on('notification', notification => {
  if (!notification) return

  switch (notification.e) {
    case 'device/feedingstarted':
      console.info('Notification received:', notification)
      store.dispatch('showSnackbar', {
        text: 'Feeding has started',
        timeout: 3000,
      })
      break
    case 'device/warningnofood':
      console.info('Notification received:', notification)
      store.dispatch('showSnackbar', {
        text: 'No food left. Please add more!',
        timeout: 10000,
      })
      break
    case 'device/feedingcomplete':
      console.info('Notification received:', notification)
      store.dispatch('showSnackbar', {
        text: `Feeding complete, portions issued: ${notification.d}`,
      })
      break
    case 'device/clocksynchronized':
      console.info('Notification received:', notification)
      store.dispatch('showSnackbar', {
        text: 'Device clock has been synchronized',
      })
      break
  }
})

store.socket = socket

export default store
