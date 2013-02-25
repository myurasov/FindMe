<?php

/*
 * Creates CSS file with 2x images
 *
 * usage: input_file [web_root]
 *
 * @author Mikhail Yurasov, 2012
 * @version 1.1
 */

// Get input file

if (isset($argv[1]))
{
  $inputFile = $argv[1];

  if (false === ($inputFile = realpath($inputFile)))
  {
    echo "Input file not found\n";
    exit(1);
  }
}
else
{
  displayUsage();
  exit(1);
}

// Get web root
// If web root is not set, use path of css file
$webRoot = isset($argv[2]) ? $argv[2] : pathinfo($argv[1], PATHINFO_DIRNAME);

if (false === ($webRoot = realpath($webRoot)))
{
  echo "Web root not found\n";
  exit(1);
}

// Process

// read file
$content = file_get_contents($inputFile);

// get css selectors/rules
$matches = array();
preg_match_all('#([^}/]+){([^}]*)#', $content, $matches);
$selectors = $matches[1];
$rules = $matches[2];

// iterate through selectors

for ($i = 0; $i < count($selectors); $i++)
{
  $selectorContent = $rules[$i];
  $rules[$i] = trim($rules[$i]);
  $rules[$i] = explode("\n", $rules[$i]);

  for ($r = 0; $r < count($rules[$i]); $r++)
  {
    $rule = $rules[$i][$r];

    // find image links

    $matches = array();

    if (preg_match('#background.*:.*url\((.*)\)#i', $rule, $matches))
    {
      $url = $matches[1];
      $url = trim($url, ' "\'');
      $file = $url;

      if (!preg_match('/data:.*;base64/i', $file))
      {
        $path = pathinfo($file, PATHINFO_DIRNAME);
        $pathComponents = explode(DIRECTORY_SEPARATOR, $path);
        $fileExt = pathinfo($file, PATHINFO_EXTENSION);
        $fileName = pathinfo($file, PATHINFO_FILENAME);
        $baseName = pathinfo($file, PATHINFO_BASENAME);

        // make a list of retina file locations

        $retinaFiles = array();

        // file@2x.ext
        $retinaFiles[] = $path . '/' . $fileName . '@2x.' . $fileExt;

        // try to add @2x, /@2x to directories
        for ($d = 0; $d < count($pathComponents); $d++)
        {
          $pathComponentsRetina = $pathComponents;
          $pathComponentsRetina[$d] = $pathComponentsRetina[$d] . '@2x';
          $retinaFiles[] = implode('/', $pathComponentsRetina) . '/' . $baseName;

          $pathComponentsRetina = $pathComponents;
          $pathComponentsRetina[$d] = $pathComponentsRetina[$d] . '/@2x';
          $retinaFiles[] = implode('/', $pathComponentsRetina) . '/' . $baseName;
        }

        // search for first existing file
        if ($retinaFile = getFirstExistingFile($webRoot, $retinaFiles))
        {
          $backgroundSize = '';

          // calc background size if it is not set
          if (
            !stristr($selectorContent, 'background-size')
            && !stristr($selectorContent, '@no-background-size')
            )
          {
            $retinaFilePath = $webRoot . '/' . $retinaFile;

            $img = new Imagick();
            $img->readImage($retinaFilePath);
            $w = $img->getImageWidth() / 2;
            $h = $img->getImageHeight() / 2;
            $img->destroy();

            $backgroundSize = "\n\tbackground-size: {$w}px {$h}px;";
          }

          $rule = trim($selectors[$i]) . " {\n\tbackground-image: url('$retinaFile');" .
            $backgroundSize . "\n}";

          echo $rule, "\n";
        }
      }
    }
  }
}

//

function getFirstExistingFile($baseDir, $files)
{
  for ($i = 0; $i < count($files); $i++)
  {
    $file = $baseDir . '/' . $files[$i];

    if (file_exists($file))
      return $files[$i];
  }

  return false;
}

//

function displayUsage()
{
  echo "Usage: php " . basename(__FILE__) . " input_file [web_root]\n";
}