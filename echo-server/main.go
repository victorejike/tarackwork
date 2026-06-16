packae main

import (
	"net/http"
)

func  Handle(w http.ResponeseWriter, r *http.Request)  {

if r .URL.Path != "/" {
	http.Error(w,"404 Not Found", http.StatusBabRequest)
	return
}

	if r.Method != http.MethodGet &&
	
}