import request from '@/utils/request'

export function listSyslogEntries (params) {
  return request({
    url: '/syslog-entries/',
    method: 'get',
    params
  })
}

export function listAuditConfigs () {
  return request({
    url: '/audit-configs/',
    method: 'get'
  })
}

export function getAuditConfigDefaults () {
  return request({
    url: '/audit/config-defaults',
    method: 'get'
  })
}

export function createAuditConfig (data) {
  return request({
    url: '/audit-configs/',
    method: 'post',
    data
  })
}

export function updateAuditConfig (id, data) {
  return request({
    url: `/audit-configs/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteAuditConfig (id) {
  return request({
    url: `/audit-configs/${id}/`,
    method: 'delete'
  })
}

export function getAuditStatus () {
  return request({
    url: '/audit/status',
    method: 'get'
  })
}
