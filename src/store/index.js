import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    connected: false,
    connectionStateString: 'Connecting...',
    eventList: [],
    eventListDate: new Date(Date.now()), // today UTC
    schedule: [],
    rpcRequestInProgress: false,
  },
  mutations: {
    setConnectionState(state, isConnected) {
      state.connected = isConnected
    },
    setConnectionStateStr(state, str) {
      state.connectionStateString = str
    },
    rpcRequestInProgress(state, isInProgress) {
      state.rpcRequestInProgress = isInProgress
    },
    setSchedule(state, schedule) {
      state.schedule = schedule
    },
    setEvents(state, events) {
      state.eventList = events
    },
  },
  actions: {
    getSchedule(context) {
      socket.once('rpc/device/getSchedule/response', response => {
        context.commit('rpcRequestInProgress', false)
        context.commit('setSchedule', response)
        console.info('getSchedule response:', response)
      })

      context.commit('rpcRequestInProgress', true)
      socket.emit('rpc/device/getSchedule')
    },
    getEvents(context, dateUtc = new Date(Date.now())) {
      socket.once('rpc/database/getEvents/response', response => {
        context.commit('rpcRequestInProgress', false)
        context.commit('setEvents', response)
        console.info('getEvents response:', response)
      })

      context.commit('rpcRequestInProgress', true)
      socket.emit('rpc/database/getEvents', dateUtc.getUTCFullYear(), dateUtc.getUTCMonth() + 1, dateUtc.getUTCDate())
    },
    setScheduleEntry(context, scheduleEntry) {
      return new Promise((resolve, reject) => {
        socket.once('rpc/device/setScheduleEntry/response', response => {
          if (response && response.error) {
            return reject(response.error)
          }

          context.commit('rpcRequestInProgress', false)
          console.info('setScheduleEntry response:', response)
          resolve(response)
        })

        context.commit('rpcRequestInProgress', true)
        socket.emit(
          'rpc/device/setScheduleEntry',
          scheduleEntry.hours,
          scheduleEntry.minutes,
          scheduleEntry.portions,
          scheduleEntry.entryIndex,
          scheduleEntry.soundIndex,
          scheduleEntry.enabled
        )
      })
    },
  },
  modules: {},
})

const socket = io('http://192.168.8.106:65500', {
  path: '/api',
  transports: ['websocket'],
})

socket.on('connect', () => {
  store.commit('setConnectionState', true)
  store.commit('setConnectionStateStr', 'Connected')
  console.info('Connection state:', 'Connected')
})

socket.on('disconnect', () => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', 'Disconnected')
  console.info('Connection state:', 'Disconnected')
})

socket.on('reconnecting', n => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', `Trying to reconnect (${n})`)
  console.info('Connection state:', 'Reconnecting...', n)
})

socket.on('reconnect_failed', () => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', `Reconnection failed`)
  console.error('Connection state:', 'Reconnection failed')
})

socket.on('connect_error', err => {
  store.commit('setConnectionState', false)
  store.commit('rpcRequestInProgress', false)
  store.commit('setConnectionStateStr', `Connection error: ${err.message}`)
  console.error(err)
})

export default store
