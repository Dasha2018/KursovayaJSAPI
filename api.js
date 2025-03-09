const personalKey = "daria-2025";
const baseHost = "https://wedev-api.sky.pro";
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;

export async function getPosts({ token }) {
  const response = await fetch(postsHost, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  });

  if (response.status === 401) {
    throw new Error("Нет авторизации");
  }
  if (!response.ok) {
    throw new Error("Ошибка при получении постов");
  }

  const data = await response.json();
  console.log("Данные с API:", data);

  return data.posts.map((post) => ({
    ...post,
    text: post.text || post.description,
    isLiked: post.likes.some((like) => like.user.id === getUserId()), // Проверяем, лайкал ли текущий пользователь
    likes: {
      counter: post.likes.length,
      users: post.likes.map((like) => like.user.name),
    },
  }));
}

// Функция для получения ID текущего пользователя
function getUserId() {
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

export function setLike(postId, token) {
  return fetch(`${postsHost}/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка при добавлении лайка");
      }
      return response.json();
    })
    .then((data) => data.post); // Возвращаем обновленный пост
}

export function removeLike(postId, token) {
  return fetch(`${postsHost}/${postId}/dislike`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Ошибка при удалении лайка");
      }
      return response.json();
    })
    .then((data) => data.post); // Возвращаем обновленный пост
}
