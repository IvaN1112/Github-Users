import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

export const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [user, setUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: '' });
  const searchGithubUser = async (user) => {
    setIsLoading(true);
    toggleError();
    const response = await axios(`${rootUrl}/users/${user}`).catch((error) =>
      console.log(error)
    );
    if (response) {
      //setting user, followers and repos data
      setUser(response.data);
      await Promise.allSettled([
        axios(`${rootUrl}/users/${user}/repos?per_page=100`),
        axios(`${rootUrl}/users/${user}/followers?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        console.log(repos, followers);
        if (repos.status === 'fulfilled') {
          setRepos(repos.value.data);
        }
        if (followers.status === 'fulfilled') {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, 'there is no such user');
    }
    checkRequests();
    setIsLoading(false);
  };
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { limit },
        } = data;
        setRequests(limit);
        if (limit === 0) {
          toggleError(true, 'sorry, you have exceeded your hourly rate limit!');
        }
      })
      .catch((error) => console.log(error));
  };
  useEffect(checkRequests, []);
  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }
  return (
    <GithubContext.Provider
      value={{
        user,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export default GithubProvider;
