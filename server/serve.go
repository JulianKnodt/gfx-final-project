package main

import (
	"log"
	"net/http"
)

func main() {
	shaders := http.FileServer(http.Dir("./shaders"))
	http.Handle("/shaders/", http.StripPrefix("/shaders/", shaders))
	resources := http.FileServer(http.Dir("./resources"))
	http.Handle("/resources/", http.StripPrefix("/resources/", resources))
	http.Handle("/", http.FileServer(http.Dir("./web")))
	log.Println("Listening on :8000...")
	if err := http.ListenAndServe(":8000", nil); err != nil {
		log.Fatalf("Server crashed %s", err)
	}
}
