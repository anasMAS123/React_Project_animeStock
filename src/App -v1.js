import { Children, useEffect, useRef, useState } from "react";
import "./index.css";
let keySolver = 0;

export default function App() {
  const [query, setQuery] = useState("");
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [targetAnime, setTargetAnime] = useState({});
  const [watchList, setWatchList] = useState([]);
  const [personRating, setPersonRating] = useState(null);
  const rateInput = useRef(null);
  const searchInput = useRef(null);

  useEffect(
    function handleChange() {
      const controller = new AbortController();
      async function getAnime() {
        if (query.length === 0) return false;
        setLoading(true);
        try {
          const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}`, {
            signal: controller.signal,
          });

          if (!res.ok) throw new Error("something went wrong");

          const data = await res.json();

          if (data.Response === "false") throw new Error("not found");

          setAnimes(data.data);
          setLoading(false);

          // console.log(data);
        } catch (err) {
          console.log(err.message);
        } finally {
          // console.log("mission complete");
        }
      }
      getAnime();
      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <div>
        <Logo query={query} onSetQuery={setQuery} searchInput={searchInput} />
      </div>
      <div className="container">
        <AnimeList animes={animes} loading={loading} onSelectId={setSelectedId}>
          <p className="header">🔎Search List</p>
          {!searchInput.current?.value.startsWith(" ") &&
            searchInput.current?.value && (
              <ul>
                {loading ? (
                  <Loading />
                ) : (
                  animes.map((anime) => (
                    <AnimeItem
                      anime={anime}
                      key={Date.now() + ++keySolver}
                      onSelectId={setSelectedId}
                    />
                  ))
                )}
              </ul>
            )}
        </AnimeList>
        {selectedId ? (
          <AnimeDetails
            selectedId={selectedId}
            setLoading2={setLoading2}
            targetAnime={targetAnime}
            setTargetAnime={setTargetAnime}
            setSelectedId={setSelectedId}
            watchList={watchList}
            setWatchList={setWatchList}
            personRating={personRating}
            rateInput={rateInput}
            setPersonRating={setPersonRating}
          />
        ) : (
          <AnimeList>
            <p className="header">🍿To Watch List</p>
            <ul>
              {watchList?.map((watchedAnime) => (
                <WatchedAnimeItem
                  anime={watchedAnime}
                  key={Date.now() + ++keySolver}
                  watchList={watchList}
                  targetAnime={targetAnime}
                  setWatchList={setWatchList}
                />
              ))}
            </ul>
          </AnimeList>
        )}
      </div>
    </>
  );
}

function Logo({ query, onSetQuery, searchInput }) {
  function handleOnChange(value) {
    onSetQuery(value ? value : "");
    // console.log(searchInput.current.value);
  }
  return (
    <div className="logo-container">
      <p className="logo">📺AnimeStock</p>
      <div>
        <label>Search anime</label>
        <input
          type="text"
          value={query}
          onChange={(e) => handleOnChange(e.target.value)}
          ref={searchInput}
        />
      </div>
    </div>
  );
}
function AnimeList({ children }) {
  return <div className="list">{children}</div>;
}
function AnimeItem({ anime, onSelectId }) {
  const { mal_id: id, title, images } = anime;
  function handleSelectId(id) {
    onSelectId(id);
  }
  async function fetchTarget() {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const data = await res.json();
    // console.log(data.data);
    onSelectId(() => handleSelectId(id));
  }
  return (
    <li className="anime-item" onClick={fetchTarget}>
      <img src={images.jpg.image_url} alt="not pic found"></img>
      <p className="p-flex">
        <span>{title}</span>
      </p>
    </li>
  );
}
function Loading() {
  return <span className="loading">Loading ...</span>;
}
function AnimeDetails({
  selectedId,
  setLoading2,
  targetAnime,
  setTargetAnime,
  setSelectedId,
  watchList,
  setWatchList,
  personRating,
  setPersonRating,
  rateInput,
}) {
  function handleCloseDetails() {
    setSelectedId(null);
  }
  function handleAddToWatchList() {
    // console.log(targetAnime);
    if (!watchList.map((anime) => anime.mal_id).includes(targetAnime.mal_id)) {
      setWatchList([
        ...watchList,
        { ...targetAnime, personRate: personRating },
      ]);

      setPersonRating(null);
      console.log(watchList);
    }

    setSelectedId(null);
  }
  function handlePersonalRating(rate) {
    setPersonRating(Number(rate));
    // console.log(rateInput.current);
  }

  useEffect(
    function () {
      async function getAnimeDetails() {
        setLoading2(true);
        try {
          if (!selectedId) return 0;
          const res = await fetch(
            `https://api.jikan.moe/v4/anime/${selectedId}`
          );

          if (!res.ok) throw new Error("something went wrong");

          const data = await res.json();

          if (data.Response === "false") throw new Error("not found");
          setTargetAnime(data.data);

          // console.log(targetAnime);

          setLoading2(false);

          // console.log(data);
        } catch (err) {
          console.log(err.message);
        } finally {
          // console.log("mission complete");
        }
      }
      getAnimeDetails();
    },
    [selectedId, setLoading2, setTargetAnime]
  );

  const {
    mal_id: id,
    title,
    genres,
    images,
    rank,
    studios,
    duration,
    source,
    trailer,
  } = targetAnime;
  return (
    <div className="target">
      <button onClick={handleCloseDetails} className="exit">
        ❌
      </button>
      <p>{title}</p>
      <img src={images?.jpg.image_url} alt="not found" />
      <div className="info">
        <span>💿 Studios : {studios?.map((studio) => studio.name)}</span>
        <span>🔈 source: {source}</span>
        <span>📖 Genras : {genres?.map((genre) => `${genre.name} `)}</span>
        <span>⭐Rank : {rank ? rank : "unRanked"}</span>
        <span>⏳ Duration per Episode : {duration}</span>
        <a href={trailer?.url} alt="not trailer found">
          ▶▶click here for the Trailer
        </a>
        <div>
          <label>💖Personal Rate</label>
          {!watchList
            .map((anime) => anime.mal_id)
            .includes(targetAnime.mal_id) ? (
            <input
              type="text"
              placeholder="rate the anime"
              className="rateInput"
              value={personRating < 10 ? personRating : 10}
              onChange={(e) =>
                handlePersonalRating(e.target.value < 10 ? e.target.value : 10)
              }
              ref={rateInput}
              maxLength={2}
            ></input>
          ) : (
            watchList.filter((anime) => anime.mal_id === targetAnime.mal_id)[0]
              .personRate
          )}
          <label> / 10 </label>
        </div>

        {rateInput.current?.value && (
          <button className="add" onClick={handleAddToWatchList}>
            + Add to watch list
          </button>
        )}

        <></>
      </div>
    </div>
  );
}
function WatchedAnimeItem({ anime, watchList, targetAnime, setWatchList }) {
  function handleOnRemove() {
    setWatchList(watchList.filter((anime) => anime.mal_id !== id));
    console.log(id);
    console.log(watchList);
  }
  const {
    title,
    mal_id: id,
    score,
    status,
    images: {
      jpg: { small_image_url: sImage },
      webp,
    },
  } = anime;
  return (
    <div className="watched">
      <button className="exit" onClick={handleOnRemove}>
        X
      </button>
      <img src={sImage} alt="not found" />
      <div className="stats-parent">
        <p className="title">{title}</p>
        <div className="statas">
          <p>
            {" "}
            your Rate 🌟: <span className="stats-info">{anime.personRate}</span>
          </p>
          <p>
            {" "}
            Rate⭐ : <span className="stats-info">{score}</span>
            <br></br>{" "}
          </p>
          <p>
            {" "}
            status☕ : <span className="stats-info">{status}</span>{" "}
          </p>
        </div>
      </div>
    </div>
  );
}
