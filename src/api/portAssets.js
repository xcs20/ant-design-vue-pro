import request from '@/utils/request'

export function listPortAssets (params) {
  return request({
    url: '/port-assets/',
    method: 'get',
    params
  })
}

export function createPortAsset (data) {
  return request({
    url: '/port-assets/',
    method: 'post',
    data
  })
}

export function updatePortAsset (id, data) {
  return request({
    url: `/port-assets/${id}/`,
    method: 'patch',
    data
  })
}

export function deletePortAsset (id) {
  return request({
    url: `/port-assets/${id}/`,
    method: 'delete'
  })
}

export function syncPortAssetsSnmp () {
  return request({
    url: '/port-assets/sync-snmp/',
    method: 'post'
  })
}
