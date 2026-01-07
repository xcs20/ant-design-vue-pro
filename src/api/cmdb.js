import request from '@/utils/request'

export function listSnmpProfiles (params) {
  return request({
    url: '/snmp-profiles/',
    method: 'get',
    params
  })
}

export function createSnmpProfile (data) {
  return request({
    url: '/snmp-profiles/',
    method: 'post',
    data
  })
}

export function updateSnmpProfile (id, data) {
  return request({
    url: `/snmp-profiles/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteSnmpProfile (id) {
  return request({
    url: `/snmp-profiles/${id}/`,
    method: 'delete'
  })
}

export function listSwitches (params) {
  return request({
    url: '/switches/',
    method: 'get',
    params
  })
}

export function createSwitch (data) {
  return request({
    url: '/switches/',
    method: 'post',
    data
  })
}

export function updateSwitch (id, data) {
  return request({
    url: `/switches/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteSwitch (id) {
  return request({
    url: `/switches/${id}/`,
    method: 'delete'
  })
}

export function listSwitchInterfaces (params) {
  return request({
    url: '/switch-interfaces/',
    method: 'get',
    params
  })
}

export function syncSwitchInterfaces (switchId) {
  return request({
    url: '/switch-interfaces/sync-snmp/',
    method: 'post',
    data: { switch: switchId }
  })
}

export function syncSwitchSnmp (switchId) {
  return request({
    url: `/switches/${switchId}/sync-snmp/`,
    method: 'post'
  })
}

export function listLocations (params) {
  return request({
    url: '/locations/',
    method: 'get',
    params
  })
}
