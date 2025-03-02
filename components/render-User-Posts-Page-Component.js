import { getPosts } from "../api.js";
import { renderHeaderComponent } from "./header-component.js";
import { formatDistanceToNow } from "../node_modules/date-fns/index.js";
import { goToPage, getToken } from "../index.js";
import {
  loadLikesState,
  saveLikesState,
} from "../components/posts-page-component.js";
import { ru } from "../node_modules/date-fns/locale/ru.js";

export function renderUserPostsPageComponent({ appEl, userId, user }) {
  console.log("Рендер страницы пользователя. User:", user);

  appEl.innerHTML = "Загрузка постов...";

  const token = getToken();

  getPosts({ token })
    .then((posts) => {
      const userPosts = posts.filter((post) => post.user.id === userId);
      loadLikesState(posts);

      const postsHtml = userPosts
        .map((post) => {
          post.likes.counter = Number(post.likes.counter) || 0;
          console.log(post.text);
          return `
              <li class="post">
                <div class="post-header" data-user-id="${post.user.id}">
                    <img src="${
                      post.user.imageUrl
                    }" class="post-header__user-image" alt="${post.user.name}">
                    <p class="post-header__user-name">${post.user.name}</p>
                </div>
                <div class="post-image-container">
                  <img class="post-image" src="${
                    post.imageUrl
                  }" alt="Изображение поста">
                </div>
                <div class="post-likes">
                  <button data-post-id="${post.id}" class="like-button">
                    <img src="./assets/images/${
                      post.isLiked ? "like-active" : "like-not-active"
                    }.svg" alt="Кнопка лайка">
                  </button>
                  <p class="post-likes-text">
                    Нравится: <strong>${post.likes.counter}</strong>
                  </p>
                </div>
                <p class="post-text">
                  <span class="user-name">${post.user.name}</span>
                  ${post.text}
                </p>
                <p class="post-date">${formatDistanceToNow(
                  new Date(post.createdAt),
                  {
                    addSuffix: true,
                    locale: ru,
                  }
                )}</p>
              </li>`;
        })
        .join("");

      appEl.innerHTML = `
          <div class="page-container">
            <div class="header-container"></div>
            <ul class="posts">
              ${postsHtml}
            </ul>
          </div>`;

      renderHeaderComponent({
        element: document.querySelector(".header-container"),
        user,
      });

      document.querySelectorAll(".post-header").forEach((userEl) => {
        userEl.addEventListener("click", () => {
          goToPage(USER_POSTS_PAGE, { userId: userEl.dataset.userId });
        });
      });
      // Обработчик кликов по кнопке лайка
      document.querySelectorAll(".like-button").forEach((button) => {
        button.addEventListener("click", (event) => {
          // Получаем токен через функцию getToken
          const token = getToken();

          // Проверяем, авторизован ли пользователь (через наличие token)
          if (!token) {
            alert("Лайк могут ставить только авторизованные пользователи");
            event.preventDefault(); // Останавливаем дальнейшее выполнение
            return; // Выход из функции
          }

          const postId = button.dataset.postId;
          const post = posts.find((p) => p.id === postId);

          if (post) {
            // Приводим counter к числовому типу
            post.likes.counter = Number(post.likes.counter) || 0;

            // Проверяем, поставил ли пользователь уже лайк
            const userHasLiked =
              post.likes.users && post.likes.users.includes(token);

            if (!userHasLiked) {
              // Если пользователь еще не ставил лайк, увеличиваем количество лайков
              post.likes.counter += 1;
              post.likes.users = post.likes.users || []; // Инициализируем массив пользователей
              post.likes.users.push(token); // Добавляем токен пользователя в список пользователей, которые поставили лайк
            } else {
              // Если пользователь уже ставил лайк, уменьшаем количество лайков
              post.likes.counter -= 1;
              post.likes.users = post.likes.users.filter(
                (user) => user !== token
              ); // Удаляем токен пользователя из списка
            }

            // Изменяем состояние лайка
            post.isLiked = !post.isLiked;

            // Обновляем изображение кнопки лайка в зависимости от состояния
            button.querySelector("img").src = `./assets/images/${
              post.likes.users.includes(token)
                ? "like-active"
                : "like-not-active"
            }.svg`;

            // Обновляем количество лайков на странице
            button.nextElementSibling.innerHTML = `Нравится: <strong>${post.likes.counter}</strong>`;

            // Сохраняем новое состояние лайков в localStorage
            saveLikesState(posts);
          }
        });
      });
    })
    .catch((error) => {
      console.error("Ошибка загрузки постов пользователя:", error);
      appEl.innerHTML = "Ошибка при загрузке постов.";
    });
}
