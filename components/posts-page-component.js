import { USER_POSTS_PAGE } from "../routes";
import { renderHeaderComponent } from "./header-component";
import { goToPage, getToken } from "../index";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { setLike, removeLike } from "../api";

/**
 * Рендерит страницу с постами.
 * @param {HTMLElement} appEl - Элемент, в который рендерится страница.
 */

/**
 * Обновляет пост в DOM.
 * @param {Object} post - Обновленный пост.
 */
function updatePostInDOM(post) {
  const postElement = document.querySelector(
    `.post[data-post-id="${post.id}"]`
  );
  if (!postElement) return;

  // Обновляем количество лайков
  const likeCountElement = postElement.querySelector(".post-likes-text strong");
  likeCountElement.textContent = post.likes.length;

  // Обновляем изображение лайка
  const likeButtonImage = postElement.querySelector(".like-button img");
  likeButtonImage.src = `./assets/images/${
    post.isLiked ? "like-active" : "like-not-active"
  }.svg`;
}
export function renderPostsPageComponent({ appEl, posts }) {
  if (!Array.isArray(posts)) {
    console.error("Posts is not defined or not an array", posts);
    posts = []; // Если данные не массив, показываем пустой список
  }

  const postsHtml = posts
    .map((post) => {
      const likeCount = post.likes?.length || 0; // Количество лайков равно длине массива likes
      return `
        <li class="post" data-post-id="${post.id}">
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
              Нравится: <strong>${likeCount}</strong>
            </p>
          </div>
          <p class="post-text">
            <span class="user-name">${post.user.name}</span>
            ${post.description}
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

  // Обработчики для кнопок лайков
  for (let likeButton of document.querySelectorAll(".like-button")) {
    likeButton.addEventListener("click", async (event) => {
      event.preventDefault();
      const postId = likeButton.dataset.postId;
      const post = posts.find((post) => post.id === postId); // Находим пост
      const token = getToken();

      if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        return;
      }

      try {
        // Если пост лайкнут, снимаем лайк, иначе ставим лайк
        if (post.isLiked) {
          await removeLike({ postId, token });
          post.isLiked = false;
          post.likes = post.likes.filter((like) => like.id !== post.user.id); // Удаляем лайк текущего пользователя
        } else {
          await setLike({ postId, token });
          post.isLiked = true;
          post.likes.push({ id: post.user.id, name: post.user.name }); // Добавляем лайк текущего пользователя
        }

        // Обновляем только измененный пост
        updatePostInDOM(post);
      } catch (error) {
        console.error("Ошибка при изменении лайка:", error);
      }
    });
  }
}
