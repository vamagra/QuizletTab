var quizletNameToUrlMap = {};
var row_title = null;
var glyphIcon = '<span class="pull-right"><span class="glyphicon glyphicon-menu-down"></span></span>';
var dropdownValue = "Created By me";
$('#repo-choice-button:first-child').html(dropdownValue + glyphIcon);

if (window != window.top) {
    microsoftTeams.initialize();
    microsoftTeams.getContext(function (context) {
        TeamsTheme.fix(context);
    });
    microsoftTeams.settings.registerOnSaveHandler(function (saveEvent) {
        setTimeout(function () {
            saveEvent.notifySuccess();
        }, 5000);
    });
}

$(document).ready(function () {
    setTimeout(populateTable, 0);
    $('#settingsSection').hide();

    /** * Set settings of the tab   */
    function saveSettings() {
        if (window != window.top) {
        
            var url = "https://841bf3ce.ngrok.io/css/quizlet_snap.png";
            var displayName = document.getElementById('tabName').value;
            var settings = {
                suggestedDisplayName: displayName,
                contentUrl: url
            }
            microsoftTeams.settings.setSettings(settings);
            microsoftTeams.settings.setValidityState(true);
        }
    }

    $('#repo-choice-dropdown li a').click(function () {
        $('#repo-choice-button:first-child').html($(this).text() + glyphIcon);
        $('#repo-choice-button:first-child').val($(this).text());
        $('#repo-choice-button').removeClass('list-border-flat').addClass('list-border-rounded');
        var selectedValue = $(this).text();
        repoToggle = false;
        window.location = "/config?selectedValue=" +selectedValue;
    });

    /**
     * Update and highlight the repo selected 
     */
    $('#table-pullrequests').on('click', 'tr', function () {
        $('.highlight').removeClass('highlight');
        $(this).addClass('highlight');
        row_title = $(this).text();
        document.getElementById('tabName').value = row_title;
        repoSelected = true;
            saveSettings();
    });

    $( "#tabName" ).keypress(function() 
    {
        saveSettings();
    });

    function populateTable() {
        var pageType = "";
        var count = 0;

        /**
         * Each Api calls gives max 30 count of issues/pull requests. In order to get more the response header needs to be parsed to get link of next page.
         * The count is set to 90 and client side pagination is implemented.
         * TO DO: Server Side pagination can be done to get the data only when user clicks on the next button.
         */
        var fetchRecords = function ()
        {
            quizletNameToUrlMap = {};
            $.each(user, function (index, eachData) {
                quizletNameToUrlMap[eachData.user.title+eachData.user.userid+eachData.user.term_count] = eachData.user.url;
                var row = '<tr>';
                row += '<td class="quizletterms"><div></div><div class="quizletTitle">'+ eachData.user.title +'</div></td>';
                row += '</tr>';
                $('#table-pullrequests').append(row);
            });
        }

        fetchRecords();
        
        $('#table-pullrequests').DataTable({
            ordering: false,
            bLengthChange: false,
            iDisplayLength: 10,
            bFilter: false,
            pagingType: 'simple_numbers',
            bInfo: false,
            scrollY: '660px',
            scrollCollapse: false,
            paging: true,
            columnDefs: [
                { 'width': '2%', 'targets': 0 },
                { 'width': '98%', 'targets': 1 }
            ],
        });

        $('#settingsSection').show();
    }

    /**
    * parse the header in the response to get the links for next pages
    */
    function getPageLinksFromHeader(header) {
        // Split parts by comma
        var parts = header.split(',');
        var links = {};
        // Parse each part into a named link
        for (var i = 0; i < parts.length; i++) {
            var section = parts[i].split(';');
            var url = section[0].replace(/<(.*)>/, '$1').trim();
            var name = section[1].replace(/rel="(.*)"/, '$1').trim();
            links[name] = url;
        }
        return links;
    }

    /**
    * get the labels associated with an issue given an issue number.
    * Each pull request is considered as an issue, so labels for any pull request can be retrieved from the corresponding issue 
    */
    function getLabels(issueNumber) {
        // replace last occurence of pulls with issues if the repoUrl contains it
        labels = '';
        var labelUrl = repoUrl.replace(new RegExp('pulls' + '$'), 'issues') + '/' + issueNumber + '/labels';
        var fetchLabels = function (done) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open('GET', labelUrl, false);
            xmlHttp.setRequestHeader('Authorization', 'Bearer ' + userData.accessToken);
            xmlHttp.onload = function () {
                var labels = JSON.parse(xmlHttp.responseText);
                var labelHtml = '<span class="labels">';
                $.each(labels, function (index, label) {
                    labelHtml += '<a title="Label: ' + label.name + '" class="label" style="background-color: #' + label.color + '; color: ' + getForeColor(label.color) + ';" >' + label.name + '</a>&nbsp';
                });
                done(labelHtml + '</span>');
            }
            xmlHttp.send();
        }
        fetchLabels(function done(labelHtml) {
            labels = labelHtml;
        });
        return labels;
    }

    /**
    * get the state(open/closed/merged) of an issue/request
    */
    function getState(issueOrRequest) {
        if (issueOrRequest.state == 'open')
            return 'open';
        else if (issueOrRequest.merged_at)
            return 'merged';
        else
            return 'closed';
    }

    /**
    * get the metadata string of an issue/request depending on the state 
    */
    function createMetaDataString(issueOrRequest, state) {
        var metaDataString = '';
        if (state == 'open')
            metaDataString = '<p class="title-metadata"> #' + issueOrRequest.number + ' was opened ' + timeSince(new Date(), issueOrRequest.created_at) + ' by ' + issueOrRequest.user.login + '</p>';
        else if (state == 'merged')
            metaDataString = '<p class="title-metadata"> #' + issueOrRequest.number + ' by ' + issueOrRequest.user.login + ' was merged ' + timeSince(new Date(), issueOrRequest.merged_at) + '</p>';
        else
            metaDataString = '<p class="title-metadata"> #' + issueOrRequest.number + ' by ' + issueOrRequest.user.login + ' was closed ' + timeSince(new Date(), issueOrRequest.closed_at) + '</p>';
        return metaDataString;
    }

    /**
    * get the image depending on the type(issue/pull request) and state(open/closed/merged) 
    */
    function getImageSrc(state, type) {
        var imageHtml = '';
        if (type == 'pulls') {
            if (state == 'open')
                imageHtml = '<img src="/custom/assets/icn_git_pullrequest_open.png" title="Open pull request">';
            else if (state == 'merged')
                imageHtml = '<img src="/custom/assets/icn_git_pullrequest_merge.png" title="Merged pull request">';
            else
                imageHtml = '<img src="/custom/assets/icn_git_pullrequest_closed.png" title="Closed pull request">';
        }
        else {
            if (state == 'open')
                imageHtml = '<img src="/custom/assets/icn_git_issue_open.png" title="Open issue">';
            else
                imageHtml = '<img src="/custom/assets/icn_git_issue_closed.png" title="Closed issue">';
        }
        return imageHtml;
    }

    /**
    * get the foreColor(white/black) for label depending on the background color 
    */
    function getForeColor(hexCode) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexCode);
        if (result) {
            var r = parseInt(result[1], 16);
            var g = parseInt(result[2], 16);
            var b = parseInt(result[3], 16);
            var o = Math.round((r * 299 + g * 587 + b * 114) / 1000);
            var foreColor = (o > 125) ? '#000' : '#fff';
            return foreColor;
        } else
            return '#000';
    }

    /**
    * Calculate the time passed since the issue/request is opened/merged/closed
    */
    function timeSince(now, timeStamp) {
        var old = new Date(timeStamp);
        secondsPast = (now.getTime() - old.getTime()) / 1000;
        if (secondsPast < 60) {
            var seconds = parseInt(secondsPast);
            if (seconds == 1)
                return 'a second ago';
            else
                return seconds + ' seconds ago';
        }
        if (secondsPast < 3600) {
            var minutes = parseInt((secondsPast) / 60);
            if (minutes == 1)
                return 'a minute ago';
            else
                return minutes + ' minutes ago';
        }
        if (secondsPast <= 86400) {
            var hours = parseInt((secondsPast) / 3600);
            if (hours == 1)
                return 'an hour ago';
            else
                return hours + ' hours ago';
        }
        if (secondsPast <= 86400 * 29) {
            var days = parseInt((secondsPast + 40500) / 86400);
            if (days == 1)
                return ' a day ago';
            else
                return days + ' days ago';
        }
        if (secondsPast >= 86400) {
            day = old.getDate();
            month = old.toDateString().match(/ [a-zA-Z]*/)[0].replace(' ', '');
            year = old.getFullYear() == now.getFullYear() ? '' : ' ' + old.getFullYear();
            return 'on ' + month + ' ' + day + year;
        }
    }

    /**
    * Display message if the user doesn't have permissions to view the private repository
    * To Do : This method will be updated once there is more content to show with images
    */
    function displayNoAccessMessage() {
        var div = document.getElementById('settingContainer');
        div.innerHTML = '';
        var noRepoDiv = $(document.createElement('div'))
            .attr('id', 'NoRepoDiv');
        noRepoDiv.after().html(
            '<i>You don\'t have permissions to view this private repository. </i>');
        noRepoDiv.appendTo(div);
    }

    /**
    * Display message if there are no pull requests/issues for that repo
    * To Do : This method will be updated once there is more content to show with images
    */
    function displayNoRecordsMessage() {
        var div = document.getElementById('settingContainer');
        div.innerHTML = '';
        var noRepoDiv = $(document.createElement('div'))
            .attr('id', 'NoRepoDiv');
        noRepoDiv.after().html(
            '<i> No records found under current selection. </i>');
        noRepoDiv.appendTo(div);
    }

    /**
    * Display generic message if incorrect parms passed
    * To Do : Decide the error message/layout
    */
    function displayErrorMessage() {

    }

    /**
    * Escape the html tags if any inside the string to avoid unpredictable results
    */
    function decodeHtmlToString(title) {
        return $('<div />').text(title).html();
    }

    if (typeof module !== 'undefined' && module.exports != null) {
        exports.timeSince = timeSince;
        exports.getState = getState;
        exports.getForeColor = getForeColor;
        exports.getImageSrc = getImageSrc;
        exports.getPageLinksFromHeader = getPageLinksFromHeader;
        exports.decodeHtmlToString = decodeHtmlToString;
    }
});





