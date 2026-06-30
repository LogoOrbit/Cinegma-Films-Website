function playTrailer(s){var o=document.getElementById('trailerOverlay'),v=document.getElementById('trailerVideo');v.src=s;o.classList.add('open');v.play();}
function closeTrailer(){var o=document.getElementById('trailerOverlay'),v=document.getElementById('trailerVideo');v.pause();v.removeAttribute('src');v.load();o.classList.remove('open');}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeTrailer();});
