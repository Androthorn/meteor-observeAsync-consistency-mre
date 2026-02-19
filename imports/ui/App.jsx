import { Counter } from "./Counter.jsx";
import { Header } from "./Header.jsx";
import { Info } from "./Info.jsx";
import React from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Mongo } from "meteor/mongo";

const CustomUsers = new Mongo.Collection("custom_users");

export const App = () => {
  const { user, customUser, isLoading } = useTracker(() => {
    const handle1 = Meteor.subscribe("userData");
    const handle2 = Meteor.subscribe("customUserData");
    return {
      user: Meteor.user(),
      customUser: CustomUsers.findOne({ _id: Meteor.userId() }),
      isLoading: !handle1.ready() || !handle2.ready(),
    };
  });

  const [dbUser, setDbUser] = React.useState(null);

  React.useEffect(() => {
    Meteor.call("checkDbUser", (err, res) => {
      if (!err) setDbUser(res);
    });
  }, []);

  const login = () => {
    Meteor.loginWithPassword("testuser", "password", (err) => {
      if (err) console.error("Login failed:", err);
      else console.log("Logged in successfully");
    });
  };

  const logout = () => {
    Meteor.logout();
  };

  return (
    <div className="page">
      <Header />
      <main className="main">
        <div style={{ padding: "20px", border: "1px solid #ccc", marginBottom: "20px" }}>
          <h2>User Data Test</h2>
          {isLoading ? (
            <p>Loading user data...</p>
          ) : user ? (
            <div>
              <p>Logged in as: {user.username}</p>
              <button onClick={logout}>Logout</button>
              
              <h3>Meteor.user() (Default Sync)</h3>
              <pre style={{ background: "#f4f4f4", padding: "10px", marginTop: "10px" }}>
                {JSON.stringify(user, null, 2)}
              </pre>

              <div style={{ marginTop: "10px" }}>
                <strong>Expected (in Meteor.user()):</strong>
                <ul>
                  <li><code>profile.customField</code> should be "modified_by_observeAsync"</li>
                  <li><code>syntheticField</code> should be "this_is_synthetic"</li>
                </ul>
                <strong>Actual (in Meteor.user()):</strong>
                <ul>
                  <li><code>profile.customField</code> is "{user?.profile?.customField}"</li>
                  <li><code>syntheticField</code> is "{user?.syntheticField || 'undefined'}"</li>
                </ul>
              </div>

              <h3>CustomUsers Collection (observeAsync)</h3>
              <pre style={{ background: "#eef", padding: "10px", marginTop: "10px" }}>
                {JSON.stringify(customUser, null, 2)}
              </pre>

              <div style={{ marginTop: "10px" }}>
                <strong>Expected (in CustomUsers):</strong>
                <ul>
                  <li><code>profile.customField</code> should be "modified_by_observeAsync"</li>
                  <li><code>syntheticField</code> should be "this_is_synthetic"</li>
                </ul>
                <strong>Actual (in CustomUsers):</strong>
                <ul>
                  <li><code>profile.customField</code> is "{customUser?.profile?.customField}"</li>
                  <li><code>syntheticField</code> is "{customUser?.syntheticField || 'undefined'}"</li>
                </ul>
              </div>

              <div style={{ marginTop: "10px" }}>
                <strong>Database State:</strong>
                <pre style={{ background: "#eef", padding: "10px" }}>
                  {JSON.stringify(dbUser, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div>
              <p>Not logged in</p>
              <button onClick={login}>Login as Test User</button>
            </div>
          )}
        </div>
        <Counter />
        <Info />
      </main>
    </div>
  );
};
