import { USER_POSTS_PAGE } from "../routes";
import { renderHeaderComponent } from "./header-component";
import { posts, goToPage, getToken } from "../index";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { setLike, removeLike } from "../api";

/**
 * Рендерит страницу с постами.
 * @param {HTMLElement} appEl - Элемент, в который рендерится страница.
 */
export function renderPostsPageComponent({ appEl }) {
  const postsHtml = posts
    .map((post) => {
      // Важно: инициализируем isLiked и counter, если их нет
      post.isLiked = post.isLiked || false;
      post.likes.counter = post.likes.counter || 0;

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

  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }

  function updatePostLikes(postId) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const postElement = document.querySelector(`[data-post-id='${postId}']`);
    if (!postElement) return;

    const likeButton = postElement.querySelector(".like-button");
    const likeText = postElement.querySelector(".post-likes-text");

    likeButton.querySelector("img").src = `./assets/images/${
      post.isLiked ? "like-active" : "like-not-active"
    }.svg`;

    const likedUsers = post.likes.users.length
      ? `: ${post.likes.users.join(", ")}`
      : "";
    likeText.textContent = `Нравится: ${post.likes.counter}${likedUsers}`;
  }

  // Обработчик кликов на кнопки лайков
  for (let likeButton of document.querySelectorAll(".like-button")) {
    likeButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      const postId = likeButton.dataset.postId;
      const token = getToken();
      if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        return;
      }

      try {
        let post = posts.find((p) => p.id === postId);
        if (!post) return;

        let updatedPost;
        if (post.isLiked) {
          updatedPost = await removeLike(postId, token);
        } else {
          updatedPost = await setLike(postId, token);
        }

        // Обновляем пост с сервера
        post.isLiked = updatedPost.likes.some(
          (like) => like.user.id === getUserId()
        );
        post.likes.counter = updatedPost.likes.length;
        post.likes.users = updatedPost.likes.map((like) => like.user.name);

        updatePostLikes(postId);
      } catch (error) {
        console.error("Ошибка при обновлении лайков:", error.message);
      }
    });
  }
}
