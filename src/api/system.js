import request from '@/utils/request'

export function listSystemSettings (params) {
  return request({
    url: '/system-settings/',
    method: 'get',
    params
  })
}

export function updateSystemSetting (id, data) {
  return request({
    url: `/system-settings/${id}/`,
    method: 'patch',
    data
  })
}

export function uploadSystemLogo (id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/system-settings/${id}/upload-logo/`,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function listOperationLogs (params) {
  return request({
    url: '/operation-logs/',
    method: 'get',
    params
  })
}

export function getSystemStatus () {
  return request({
    url: '/system/status',
    method: 'get'
  })
}

export function listSystemUpdates (params) {
  return request({
    url: '/system-updates/',
    method: 'get',
    params
  })
}

export function uploadSystemUpdate (file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/system-updates/',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function applySystemUpdate (id) {
  return request({
    url: `/system-updates/${id}/apply/`,
    method: 'post'
  })
}

export function listSystemTasks (params) {
  return request({
    url: '/system-tasks/',
    method: 'get',
    params
  })
}

export function createSystemTask (data) {
  return request({
    url: '/system-tasks/',
    method: 'post',
    data
  })
}

export function updateSystemTask (id, data) {
  return request({
    url: `/system-tasks/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteSystemTask (id) {
  return request({
    url: `/system-tasks/${id}/`,
    method: 'delete'
  })
}
