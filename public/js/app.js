function openWindow(url, source, width, height) {
  var callback = function ()
  {
    window.location.reload(true);
  };
  if (window.microsoftTeams) {
    microsoftTeams.authentication.authenticate({
      url: url,
      width: width,
      height: height,
      successCallback: callback,
      failureCallback: callback,
    });
  }
  else {
    window.open(url, "_blank", "width=" + width + ", height=" + height);
  }
}

function signInWithQuizlet(event, source) 
{
  event.preventDefault();
  openWindow("/auth/quizlet", source, 500, 650);  
  // var url = "https://quizlet.com/authorize?response_type=code&client_id=SCh2wDU4gZ&scope=read&state=quizlet&redirect_url=https://841bf3ce.ngrok.io/callback";
  // openWindow(url, source, 500, 650);
}