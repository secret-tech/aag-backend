import request from 'request-promise'

export const getUser = (accessToken) =>
  request({
    uri: 'https://graph.facebook.com/me',
    json: true,
    qs: {
      access_token: accessToken,
      fields: 'id, name, email, picture.height(500), gender, birthday'
    }
  }).then(({ id, name, email, picture, gender, birthday }) => ({
    service: 'facebook',
    picture: picture.data.url,
    id,
    name,
    email,
    gender,
    birthday,
  }))
