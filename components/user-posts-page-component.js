import { renderHeaderComponent } from "./header-component.js";
import { getToken, posts } from "../index.js";
import { setLike, removeLike, getPosts } from "../api";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale/ru";

export function renderUserPostsPageComponent({ appEl, userId, user }) {
  appEl.innerHTML = "Загрузка постов...";

  const token = getToken();

  getPosts({ token })
    .then((posts) => {
      const userPosts = posts.filter((post) => post.user.id === userId);

      const postsHtml = userPosts
        .map((post) => {
          post.likes = post.likes || {};
          post.likes.counter = Number(post.likes.counter) || 0;
          post.isLiked = post.isLiked || false;

          return `
              <li class="post" data-post-id="${post.id}">
                <div class="post-header" data-user-id="${post.user.id}">
                    <img src="${post.user.imageUrl}" 
                         class="post-header__user-image" 
                         alt="${post.user.name}">
                    <p class="post-header__user-name">${post.user.name}</p>
                </div>
                <div class="post-image-container">
                  <img class="post-image" src="${post.imageUrl}" 
                       alt="Изображение поста">
                </div>
                <div class="post-likes">
                  <button class="like-button">
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

      // Функция обновления UI лайков
      function updatePostLikes(postId) {
        const post = posts.find((p) => p.id === postId);
        if (!post) return;

        const postElement = document.querySelector(
          `[data-post-id='${postId}']`
        );
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
      // Обработчик кликов на лайк
      document.querySelectorAll(".like-button").forEach((likeButton) => {
        likeButton.addEventListener("click", async (event) => {
          event.stopPropagation(); // Предотвращаем всплытие

          const postElement = event.target.closest(".post");
          if (!postElement) return;

          const postId = postElement.dataset.postId;
          const token = getToken();

          if (!token) {
            alert("Вы не авторизованы. Войдите в систему.");
            return;
          }

          try {
            const post = userPosts.find((p) => p.id == postId);
            if (!post) return;

            if (post.isLiked) {
              await removeLike(postId, token);
              post.isLiked = false;
              post.likes.counter = Math.max(0, post.likes.counter - 1);
            } else {
              await setLike(postId, token);
              post.isLiked = true;
              post.likes.counter += 1;
            }
            getPosts();
            renderUserPostsPageComponent();
            updatePostLikes(postId);
          } catch (error) {
            console.error("Ошибка обновления лайков:", error.message);
          }
        });
      });
    })
    .catch((error) => {
      console.error("Ошибка загрузки постов:", error);
      appEl.innerHTML = "Ошибка при загрузке постов.";
    });
}
