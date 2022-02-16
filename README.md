# blog-source
### About
This repo contains the static site generation source for the blog I host on my github.

The site is currently generated using Hugo and the contrast-hugo theme.

[Hugo](https://gohugo.io/)  
[contrast-hugo](https://github.com/niklasbuschmann/contrast-hugo/tree/9b3ec3d0243d3076342e53bbdcc6579265eb1cb6) 

### Testing
After adding new content files, you can demo the site by running the command
```
hugo server -D
```
and navigating to `http://localhost:1313/` in your browser.

### Build and deployment
To build the site, navigate to the repo folder and then run the command

```
hugo -D
```

This will generate the final site files in the public folder, which is just a submodule linked to the main branch of my [github pages repo](https://github.com/kshatos/kshatos.github.io). Then simply navigate to the public folder and push the new files to deploy.