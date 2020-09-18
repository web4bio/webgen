## Download Git 
[Download Git from here](https://git-scm.com/downloads)

## Setting up your branch

Open your preferred terminal (Cmd, Powershell, Bash) and run the following command in your desktop directory.
``` bash
git clone https://github.com/web4bio/webgen
```

Enter your webgen directory with the following command
``` bash
cd webgen
```

Right now you only have the master branch, use this following command to pull the development branch:
``` bash
git checkout -b development origin/development
```

Now you are going to create your own branch, which will be the only branch you are working on. Run the following command:
``` bash
git checkout -b name_of_the_thing_you_want_to_work_on
```

"Setting up the upstream" basically means telling your current branch which other branch to reference when updating itself with other people's code. To setup an upstream to the development branch, do the following:
``` bash
git checkout -b name_of_the_thing_you_want_to_work_on
```

Now let's check that the setup everything is correct with the following command:
``` bash
git branch -vv
```

Your terminal should look like this:

<img src="presentationPoster\images\gitBranchingCheck.png" alt="Kitten" title="Git Branching Check" style="border-radius : 7px" />

This is the layout of the Git branches and an example of the workflow we will try to follow:
<img src="presentationPoster\images\gitBranchWokflow.png" alt="Kitten" title="Git Branching Check" style="border-radius : 7px" />



