import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, getToken } from "../index.js";
import { formatDistanceToNow } from "../node_modules/date-fns/index.js";
import { ru } from "../node_modules/date-fns/locale/ru.js";

// Функция для сохранения состояния лайков в localStorage
export function saveLikesState(posts) {
  const likesState = posts.map((post) => ({
    id: post.id,
    isLiked: post.isLiked,
    counter: post.likes.counter,
  }));
  localStorage.setItem("likesState", JSON.stringify(likesState));
}

// Функция для загрузки состояния лайков из localStorage
export function loadLikesState(posts) {
  const savedLikesState = JSON.parse(localStorage.getItem("likesState"));
  if (savedLikesState) {
    savedLikesState.forEach((savedPost) => {
      const post = posts.find((p) => p.id === savedPost.id);
      if (post) {
        post.isLiked = savedPost.isLiked;
        post.likes.counter = savedPost.counter;
      }
    });
  }
}

/**
 * Рендерит страницу с постами.
 * @param {HTMLElement} appEl - Элемент, в который рендерится страница.
 * @param {Object} user - Объект авторизованного пользователя (или null, если не авторизован).
 */
export function renderPostsPageComponent({ appEl }) {
  console.log("Актуальный список постов:", posts);

  // Загружаем состояние лайков из localStorage
  loadLikesState(posts);

  const postsHtml = posts
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
          <p class="post-date">${formatDistanceToNow(new Date(post.createdAt), {
            addSuffix: true,
            locale: ru,
          })}</p>
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
  });

  // Обработчик кликов на заголовок поста (переход в профиль)
  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }

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
          post.likes.users = post.likes.users.filter((user) => user !== token); // Удаляем токен пользователя из списка
        }

        // Изменяем состояние лайка
        post.isLiked = !post.isLiked;

        // Обновляем изображение кнопки лайка в зависимости от состояния
        button.querySelector("img").src = `./assets/images/${
          post.likes.users.includes(token) ? "like-active" : "like-not-active"
        }.svg`;

        // Обновляем количество лайков на странице
        button.nextElementSibling.innerHTML = `Нравится: <strong>${post.likes.counter}</strong>`;

        // Сохраняем новое состояние лайков в localStorage
        saveLikesState(posts);
      }
    });
  });
}
