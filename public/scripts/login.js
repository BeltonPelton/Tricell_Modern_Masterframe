function openLogin() {
    document.getElementById("loginPanel").classList.add("active");
    document.getElementById("overlay").classList.add("active");
}

function closeLogin() {
    document.getElementById("loginPanel").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}

function hashing()
	{
		document.form.fpassword.value = hex_md5(document.form.fpassword.value);
	}

	function formCheck()
	{
		if(document.form.femployeecode.value=="")
		{
				   alert("You must give an employee code!");
				return false;
		}
		if(document.form.fpassword.value=="")
		{
				   alert("You must give a password!");
				return false;
		}
	}