import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'

const RPC_TIMEOUT = 3000

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
      return context.dispatch('rpc', {
        event: 'rpc/device/setScheduleEntry',
        args: [
          // we need to pass this arguments in particular order (see petwant-device setScheduleEntry method)
          scheduleEntry.hours,
          scheduleEntry.minutes,
          scheduleEntry.portions,
          scheduleEntry.entryIndex,
          scheduleEntry.soundIndex,
          scheduleEntry.enabled,
        ],
      }) // returns Promise
    },
    rpc(context, rpcConfig) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // unsubscribing of whatever/rpc/call/response
          socket.off(rpcConfig.event + '/response')
          reject('Remote procedure call timeout')
        }, RPC_TIMEOUT)

        // subscribing to whatever/rpc/call/response
        socket.once(rpcConfig.event + '/response', response => {
          clearTimeout(timeout) // clearing timeout first

          if (response && response.error) {
            return reject(response.error)
          }

          context.commit('rpcRequestInProgress', false)
          console.info('setScheduleEntry response:', response)
          resolve(response)
        })

        context.commit('rpcRequestInProgress', true)
        // sending rpc request
        socket.emit(rpcConfig.event, ...rpcConfig.args) // passing args in arguments
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
