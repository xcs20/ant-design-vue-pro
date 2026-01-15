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

export function listSnmpOidProfiles (params) {
  return request({
    url: '/snmp-oid-profiles/',
    method: 'get',
    params
  })
}

export function createSnmpOidProfile (data) {
  return request({
    url: '/snmp-oid-profiles/',
    method: 'post',
    data
  })
}

export function updateSnmpOidProfile (id, data) {
  return request({
    url: `/snmp-oid-profiles/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteSnmpOidProfile (id) {
  return request({
    url: `/snmp-oid-profiles/${id}/`,
    method: 'delete'
  })
}

export function listPolicyProfiles (params) {
  return request({
    url: '/policy-profiles/',
    method: 'get',
    params
  })
}

export function createPolicyProfile (data) {
  return request({
    url: '/policy-profiles/',
    method: 'post',
    data
  })
}

export function updatePolicyProfile (id, data) {
  return request({
    url: `/policy-profiles/${id}/`,
    method: 'patch',
    data
  })
}

export function deletePolicyProfile (id) {
  return request({
    url: `/policy-profiles/${id}/`,
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

export function importSwitches (file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/switches/bulk-import/',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
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

export function updateSwitchInterface (id, data) {
  return request({
    url: `/switch-interfaces/${id}/`,
    method: 'patch',
    data
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

export function listVendors (params) {
  return request({
    url: '/vendors/',
    method: 'get',
    params
  })
}

export function createVendor (data) {
  return request({
    url: '/vendors/',
    method: 'post',
    data
  })
}

export function updateVendor (id, data) {
  return request({
    url: `/vendors/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteVendor (id) {
  return request({
    url: `/vendors/${id}/`,
    method: 'delete'
  })
}
