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
      return context
        .dispatch('rpc', {
          event: 'rpc/device/getSchedule',
        })
        .then(schedule => {
          context.commit('setSchedule', schedule)
        }) // Returns Promise, so we can handle .catch in desired Vue component in order to show error message
    },
    getEvents(context, dateUtc = new Date(Date.now())) {
      return context
        .dispatch('rpc', {
          event: 'rpc/database/getEvents',
          args: [dateUtc.getUTCFullYear(), dateUtc.getUTCMonth() + 1, dateUtc.getUTCDate()],
        })
        .then(events => {
          context.commit('setEvents', events)
          return events
        }) // Returns Promise, so we can handle .catch in desired Vue component in order to show error message
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
      }) // Returns Promise, so we can handle .catch in desired Vue component in order to show error message
    },
    rpc(context, rpcConfig) {
      rpcConfig.args = rpcConfig.args || []
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // unsubscribing of whatever/rpc/call/response
          console.error(`RPC "${rpcConfig.event}" timeout`)
          socket.off(rpcConfig.event + '/response')
          reject('Remote procedure call timeout')
        }, RPC_TIMEOUT)

        // subscribing to "whatever/rpc/call/response"
        socket.once(rpcConfig.event + '/response', response => {
          clearTimeout(timeout) // clearing timeout first
          context.commit('rpcRequestInProgress', false)
          console.info(`RPC "${rpcConfig.event}" response:`, response)
          if (response && response.error) return reject(response.error)
          resolve(response)
        })

        context.commit('rpcRequestInProgress', true)
        // sending RPC request
        console.info(`RPC "${rpcConfig.event}" request:`, ...rpcConfig.args)
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
