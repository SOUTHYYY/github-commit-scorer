const fs = require("node:fs");
const path = require("node:path");
const git = require("simple-git");

const gitToken = "YOUR GITHUB TOKEN";
const gitName = "YOUR_GITHUB_NAME";
const gitEmail = "YOUR_GITHUB_EMAIL";

const COMMIT_DAYS = 120;

const commitMessage = "Your commit message";
const localPath = "./localRepo";

//Function to generate unique name for the file
function generateUniqueName() {
  return `fact_${Math.floor(Math.random() * 150000000)}.txt`;
}

const createCatNameFile = async () => {
  const branchFilesData = fs.readdirSync(localPath);

  let randomName = generateUniqueName();

  //Check if file name is unique in the repo
  const isAlreadyFileNameExist = !!branchFilesData.find((path) => {
    return path === randomName;
  });

  //If file name is not unique, generate new name
  if (isAlreadyFileNameExist) {
    createCatNameFile();
  }

  const catsResponse = await fetch("https://catfact.ninja/fact");
  const { fact } = await catsResponse.json();

  fs.writeFileSync(path.join(localPath, randomName), fact, {
    encoding: "utf8",
  });
};

//Function to push random cat fact to the GitHub repo
async function createCommit(
  repoOwner,
  repoOwnerEmail,
  commitDate,
  token,
  remote
) {
  try {
    await git(localPath).addConfig("user.name", repoOwner);
    await git(localPath).addConfig("user.email", repoOwnerEmail);
    await createCatNameFile();
    await git(localPath).add("./*");
    await git(localPath).commit(commitMessage);
    const date = new Date(commitDate)
      .toISOString()
      .replace("T", " ")
      .replace("Z", "")
      .split(".")[0];
    console.log("Commmit Date", date);
    await git(localPath).raw([
      "commit",
      "--amend",
      "--date",
      date,
      "-m",
      commitMessage,
    ]);
    await git(localPath)
      .push(remote, "main")
      .catch((err) => console.error("failed: ", err));

    console.log("Pushed fact to randomCatFacts");
  } catch (error) {
    console.error("Error pushing fact to randomCatFacts", error);
  }
}

const timeout = (ms) => new Promise((res) => setTimeout(res, ms * 1000));

const useActionsWithCallNext = async (idx, array, callback) => {
  const nextIdx = idx + 1;
  if (array.length === idx) {
    console.log("Finished!");
    return;
  }
  try {
    const actionData = array[idx];
    await callback(actionData, idx);
  } catch (err) {
    console.log(err);
  } finally {
    await timeout(0.5);
    return useActionsWithCallNext(nextIdx, array, callback);
  }
};

(async () => {
  fs.rm(localPath, { recursive: true, force: true }, () => undefined);
  const remote = `https://${gitToken}@github.com/${gitName}/randomCatFacts.git`;
  await git().clone(remote, localPath);
  await useActionsWithCallNext(
    0,
    new Array(COMMIT_DAYS).fill(),
    async (_, idx) => {
      const today = new Date();
      const commitDate = new Date(new Date().setDate(today.getDate() - idx));
      await createCommit(gitName, gitEmail, commitDate, gitToken, remote);
    }
  );
})();
