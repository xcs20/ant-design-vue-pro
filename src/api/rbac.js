import request from '@/utils/request'

export function listRoles (params) {
  return request({
    url: '/roles/',
    method: 'get',
    params
  })
}

export function createRole (data) {
  return request({
    url: '/roles/',
    method: 'post',
    data
  })
}

export function updateRole (id, data) {
  return request({
    url: `/roles/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteRole (id) {
  return request({
    url: `/roles/${id}/`,
    method: 'delete'
  })
}

export function listPermissions (params) {
  return request({
    url: '/permissions/',
    method: 'get',
    params
  })
}
