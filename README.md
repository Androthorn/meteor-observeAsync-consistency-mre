# Minimal Reproducible Example: Meteor 3.4 `observeAsync` Data Consistency Issue

## Overview

This document outlines my investigation and creation of a Minimal Reproducible Example (MRE) for an active bug in Meteor 3.4 regarding `observeAsync` and data consistency between server-side publications and the client-side Minimongo, specifically concerning the `Meteor.user()` object.

**Issue Reference:** [Issue with observeAsync in Meteor 3.0.4 #13453](https://github.com/meteor/meteor/issues/13453)

## The Problem

When using `self.added` (or `this.added`) within an `observeAsync` callback to manually modify a user document before it reaches the client, the client-side `Meteor.user()` object reverts to the raw database state. The modifications made during the publication are ignored or overwritten by the default account synchronization logic.

## What I Did

I built an MRE to specifically test this "revert to DB state" behavior using Meteor 3.4 async patterns.

### 1. Server-Side Setup (`server/main.js`)

*   **Test User Creation:** I added a startup block that creates a test user (`testuser` / `password`) with a default `profile.customField` set to `"original_db_value"`.
*   **Publication 1: `userData` (The Bug):** I created a publication that uses `observeAsync` on the `Meteor.users` collection for the currently logged-in user. Inside the `added` and `changed` callbacks, I deep-cloned the user object and modified it *before* sending it to the client via `this.added("users", ...)` and `this.changed("users", ...)`.
    *   Modification: `profile.customField` changed to `"modified_by_observeAsync"`.
    *   Addition: A new `syntheticField` added with the value `"this_is_synthetic"`.
*   **Publication 2: `customUserData` (The Workaround):** I created a second publication that performs the exact same modifications but publishes the data to a custom collection named `"custom_users"` instead of the default `"users"` collection.
*   **Database Check Method:** I added a Meteor method `checkDbUser` to fetch the raw database state of the user for comparison on the client.

### 2. Client-Side Setup (`imports/ui/App.jsx`)

*   **Dependencies:** I ensured `react-meteor-data` and `accounts-password` were installed and configured.
*   **Subscriptions:** The main `App` component subscribes to both `"userData"` and `"customUserData"`.
*   **UI Implementation:** I built a simple UI to log in as the test user and display three distinct states:
    1.  **`Meteor.user()` (Default Sync):** Displays the state of the user object as managed by Meteor's default accounts system. This demonstrates the bug, as the actual values revert to the database state, ignoring the server-side modifications.
    2.  **`CustomUsers` Collection (observeAsync):** Displays the state of the user object when published to a custom collection. This demonstrates the workaround, as the modifications made in `observeAsync` are correctly preserved.
    3.  **Database State:** Displays the raw database state of the user object fetched via the `checkDbUser` method for reference.


### Findings

The issue stems from how Meteor's accounts system synchronizes the currently logged-in user. When a user logs in, the `accounts-base` package automatically sets up an internal subscription to the current user's document to keep `Meteor.user()` in sync with the database.

When a custom publication (like my `"userData"`) also publishes to the `"users"` collection for the same `_id`, Minimongo on the client receives updates from *both* subscriptions. Because the default accounts subscription sends the raw database state, it overwrites the synthetic modifications made in the custom publication.

### Workaround

The MRE proves that the most reliable way to send synthetic or modified user data to the client is to publish it to a *different* collection name (e.g., `"custom_users"`). This prevents the default accounts synchronization logic from interfering with the custom data, ensuring that the client receives and retains the modified state.

## Next Steps
*   Developers encountering this issue can use the demonstrated workaround (publishing to a custom collection) until a fix is implemented in Meteor core.
