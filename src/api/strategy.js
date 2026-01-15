import request from '@/utils/request'

export function listStrategyPolicies (params) {
  return request({
    url: '/strategy-policies/',
    method: 'get',
    params
  })
}

export function createStrategyPolicy (data) {
  return request({
    url: '/strategy-policies/',
    method: 'post',
    data
  })
}

export function updateStrategyPolicy (id, data) {
  return request({
    url: `/strategy-policies/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteStrategyPolicy (id) {
  return request({
    url: `/strategy-policies/${id}/`,
    method: 'delete'
  })
}
