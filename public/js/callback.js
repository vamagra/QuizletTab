function openWindow(url, source, width, height) 
{
    window.location.href = url;
}

$(document).ready(function () {
    window.location = "\config";
});

function postAndRedirect(url, postData)
{
    var postFormStr = "<form method='POST' action='" + url + "'>\n";

    for (var key in postData)
    {
        if (postData.hasOwnProperty(key))
        {
            postFormStr += "<input type='hidden' name='" + key + "' value='" + postData[key] + "'></input>";
        }
    }

    postFormStr += "</form>";

    var formElement = $(postFormStr);

    $('body').append(formElement);
    $(formElement).submit();
}