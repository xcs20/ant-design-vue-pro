import request from '@/utils/request'

export function listIpRanges (params) {
  return request({
    url: '/ip-ranges/',
    method: 'get',
    params
  })
}

export function createIpRange (data) {
  return request({
    url: '/ip-ranges/',
    method: 'post',
    data
  })
}

export function updateIpRange (id, data) {
  return request({
    url: `/ip-ranges/${id}/`,
    method: 'patch',
    data
  })
}

export function deleteIpRange (id) {
  return request({
    url: `/ip-ranges/${id}/`,
    method: 'delete'
  })
}
