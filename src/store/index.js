import Vue from 'vue'
import Vuex from 'vuex'
import io from 'socket.io-client'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    connected: false,
    connectionStateString: 'Connecting...',
  },
  mutations: {
    connectionState(state, isConnected) {
      state.connected = isConnected
    },
    connectionStateStr(state, str) {
      state.connectionStateString = str
    },
  },
  actions: {
    // connect(context) {},
  },
  modules: {},
})

const socket = io('http://192.168.8.106:65500', {
  path: '/api',
  transports: ['websocket'],
})

socket.on('connect', () => {
  store.commit('connected', true)
  store.commit('connectionStateStr', 'Connected')
  console.info('Connection state:', 'Connected')
})

socket.on('disconnect', () => {
  store.commit('connected', false)
  store.commit('connectionStateStr', 'Disconnected')
  console.info('Connection state:', 'Disconnected')
})

socket.on('reconnecting', n => {
  store.commit('connected', false)
  store.commit('connectionStateStr', `Trying to reconnect (${n})`)
  console.info('Connection state:', 'Reconnecting...', n)
})

socket.on('reconnect_failed', () => {
  store.commit('connected', false)
  store.commit('connectionStateStr', `Reconnection failed`)
  console.error('Connection state:', 'Reconnection failed')
})

socket.on('connect_error', err => {
  store.commit('connected', false)
  store.commit('connectionStateStr', `Connection error: ${err.message}`)
  console.error(err)
})

export default store
