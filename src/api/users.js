import request from '@/utils/request'

export function listUsers (params) {
  return request({
    url: '/users/',
    method: 'get',
    params
  })
}

export function createUser (data) {
  return request({
    url: '/users/',
    method: 'post',
    data
  })
}

export function updateUser (id, data) {
  return request({
    url: `/users/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteUser (id) {
  return request({
    url: `/users/${id}/`,
    method: 'delete'
  })
}
