import { Meteor } from "meteor/meteor";
import { LinksCollection } from "/imports/api/links";
import { Random } from "meteor/random";
import { Accounts } from "meteor/accounts-base";

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

Meteor.startup(async () => {
  // Create a test user if none exists
  if ((await Meteor.users.find().countAsync()) === 0) {
    await Accounts.createUserAsync({
      username: "testuser",
      password: "password",
      profile: {
        customField: "original_db_value"
      }
    });
  }

  // If the Links collection is empty, add some data.
  if ((await LinksCollection.find().countAsync()) === 0) {
    await insertLink({
      title: "Do the Tutorial",
      url: "https://docs.meteor.com/tutorials/react/",
    });

    await insertLink({
      title: "Follow the Guide",
      url: "https://docs.meteor.com/tutorials/application-structure/",
    });

    await insertLink({
      title: "Read the Docs",
      url: "https://docs.meteor.com",
    });

    await insertLink({
      title: "Discussions",
      url: "https://forums.meteor.com",
    });

    await insertLink({
      title: "Join us on Discord",
      url: "https://discord.gg/6mS3wHNg",
    });

    await insertLink({
      title: "Deploying in Galaxy",
      url: "https://www.meteor.com/hosting",
    });
  }

  // We publish the entire Links collection to all clients.
  // In order to be fetched in real-time to the clients
  Meteor.publish("links", function () {
    return LinksCollection.find();
  });

  // Publish the current user with a modified profile field
  Meteor.publish("userData", async function () {
    if (!this.userId) {
      return this.ready();
    }

    const handle = await Meteor.users.find({ _id: this.userId }).observeAsync({
      added: async (user) => {
        // Modify the user object before sending it to the client
        const modifiedUser = { ...user };
        modifiedUser.profile = { ...modifiedUser.profile };
        modifiedUser.profile.customField = "modified_by_observeAsync";
        modifiedUser.syntheticField = "this_is_synthetic";
        
        console.log("Server: Sending modified user to client:", modifiedUser);
        this.added("users", modifiedUser._id, modifiedUser);
      },
      changed: async (newUser, oldUser) => {
        const modifiedUser = { ...newUser };
        modifiedUser.profile = { ...modifiedUser.profile };
        modifiedUser.profile.customField = "modified_by_observeAsync";
        modifiedUser.syntheticField = "this_is_synthetic";
        
        console.log("Server: Sending changed user to client:", modifiedUser);
        this.changed("users", modifiedUser._id, modifiedUser);
      },
      removed: async (user) => {
        this.removed("users", user._id);
      }
    });

    this.ready();

    this.onStop(() => {
      handle.stop();
    });
  });

  // Publish the current user with a modified profile field to a custom collection
  Meteor.publish("customUserData", async function () {
    if (!this.userId) {
      return this.ready();
    }

    const handle = await Meteor.users.find({ _id: this.userId }).observeAsync({
      added: async (user) => {
        // Modify the user object before sending it to the client
        const modifiedUser = { ...user };
        modifiedUser.profile = { ...modifiedUser.profile };
        modifiedUser.profile.customField = "modified_by_observeAsync";
        modifiedUser.syntheticField = "this_is_synthetic";
        
        console.log("Server: Sending modified user to custom collection:", modifiedUser);
        this.added("custom_users", modifiedUser._id, modifiedUser);
      },
      changed: async (newUser, oldUser) => {
        const modifiedUser = { ...newUser };
        modifiedUser.profile = { ...modifiedUser.profile };
        modifiedUser.profile.customField = "modified_by_observeAsync";
        modifiedUser.syntheticField = "this_is_synthetic";
        
        console.log("Server: Sending changed user to custom collection:", modifiedUser);
        this.changed("custom_users", modifiedUser._id, modifiedUser);
      },
      removed: async (user) => {
        this.removed("custom_users", user._id);
      }
    });

    this.ready();

    this.onStop(() => {
      handle.stop();
    });
  });
});

Meteor.methods({
  about() {
    return `This is a Meteor application running React with React Router. this is a generated id: ${Random.id()}`;
  },
  async checkDbUser() {
    const user = await Meteor.users.findOneAsync({ username: "testuser" });
    return user;
  }
});
