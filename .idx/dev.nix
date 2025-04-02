{ pkgs, ... }: {
  channel = "stable-23.11";

  packages = [
    pkgs.nodejs
    pkgs.nodePackages.npm
    pkgs.python3
  ];

  env = {};
  idx = {
    extensions = [
    ];

    previews = {
      enable = true;
      previews = {
        web =  {
          command = [ "python3" "-m" "http.server" "$PORT" "--bind" "0.0.0.0" "--directory" "html_js" ];
          manager = "web";
         
        };
      };
    };
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Example: start a background task to watch and re-build backend code
        # watch-backend = "npm run watch-backend";
      };
    };
    
  };
}
