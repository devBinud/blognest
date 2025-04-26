<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>

<body>
    <div class="main w-full min-h-screen bg-zinc-900">
        <h3>Create User</h3>
        <div class="form p-10 text-white">
            <form action="/create" method="post">
                <input class="block px-5 w-full py-2 rounded-md bg-zinc-800 text-white" type="text" name="username"
                    placeholder="username">

                    <input class="block px-5 w-full py-2 mt-2 rounded-md bg-zinc-800 text-white" type="text" name="email"
                    placeholder="email">

                    <input class="block px-5 w-full py-2 mt-2 rounded-md bg-zinc-800 text-white" type="text" name="password"
                    placeholder="password">

                    <input class="block px-5 w-full py-2 mt-2 rounded-md bg-zinc-800 text-white" type="text" name="age"
                    placeholder="age">
               
                <input type="submit" class="w-full px-10 py-2 mt-2 rounded-md bg-blue-900 text-white font-semibold 
                           hover:bg-blue-800 transition-all duration-300 cursor-pointer" value="Register">
            </form>

        </div>

        <!-- <div class="tasks flex  gap-3 flex-wrap p-10">
            <div class="task text-white w-72 px-3 py-4 rounded-md bg-zinc-800">
                <h1 class="text-white text-3xl tracking-tighter">

                </h1>
                <a href="/file/" class="text-blue-400 mt-3 block">Read More</a>
                <a href="/edit/">Edit Filename</a>
            </div>
            <h3 class="text-white text-2xl">No Task Yet</h3>
        </div> -->
    </div>
</body>

</html>