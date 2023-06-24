$(document).ready(function () {
  // init
  var firstTab = $('a[data-toggle="pill"]').first()
  var firstTarget = firstTab.attr('href')
  var firstUrl = firstTab.data('url')

  $('.tab-pane').empty().html('<div class="loader">loading...</div>')

  $.ajax({
    url: firstUrl,
    type: 'GET',
    success: function (data) {
      $(firstTarget).empty().html(data)
    }
  })

  // register tab loading
  $('a[data-toggle="pill"]').on('show.bs.tab', function (e) {
    // empty all tab
    $('.tab-pane').empty().html('<div class="loader">loading...</div>')

    var target = $(e.target).attr('href')
    var url = $(e.target).data('url')
    $.ajax({
      url: url,
      type: 'GET',
      success: function (data) {
        $(target).empty().html(data)
      }
    })
  })
})
