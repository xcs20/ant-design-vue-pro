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
