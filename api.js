const personalKey = "daria-2025";
const baseHost = "https://wedev-api.sky.pro";
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;

export function getPosts({ token }) {
  return fetch(postsHost, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Данные, полученные с API:", data);
      return data.posts;
    });
}

// Функция для получения ID текущего пользователя
export function getUserId() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  return user.id;
}

export function registerUser({ login, password, name, imageUrl }) {
  return fetch(baseHost + "/api/user", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
      name,
      imageUrl,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Такой пользователь уже существует");
    }
    return response.json();
  });
}

export function loginUser({ login, password }) {
  return fetch(baseHost + "/api/user/login", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
    }),
  }).then((response) => {
    if (response.status === 400) {
      throw new Error("Неверный логин или пароль");
    }
    return response.json();
  });
}

export function uploadImage({ file }) {
  const data = new FormData();
  data.append("file", file);

  return fetch(baseHost + "/api/upload/image", {
    method: "POST",
    body: data,
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Ошибка при загрузке изображения");
    }
    return response.json();
  });
}

export function addPost({ description, imageUrl, token }) {
  return fetch(postsHost, {
    method: "POST",
    headers: {
      Authorization: token,
    },
    body: JSON.stringify({
      description,
      imageUrl,
    }),
  }).then((response) => {
    if (!response.ok) {
      return response.json().then((data) => {
        console.error("Ошибка от API:", data);
        throw new Error(data.error || "Ошибка при добавлении поста");
      });
    }
    return response.json();
  });
}

export async function setLike({ postId, token }) {
  const response = await fetch(`${postsHost}/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error("Ошибка при добавлении лайка");
  }

  return response.json();
}

export async function removeLike({ postId, token }) {
  const response = await fetch(`${postsHost}/${postId}/dislike`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error("Ошибка при удалении лайка");
  }

  return response.json();
}
