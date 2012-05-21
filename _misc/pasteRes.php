<?php

if ($argc > 1)
{
  $file = $argv[1];

  if (file_exists($file))
  {
    $inputDir = pathinfo($file, PATHINFO_DIRNAME);
    $getJsCommand = "cat %s | java -jar /tools/misc/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar --type js";
    $getCssCommand = "cat %s | java -jar /tools/misc/yuicompressor-2.4.7/build/yuicompressor-2.4.7.jar --type css";
    $fc = file_get_contents($file);

    // js
    $m = array();
    preg_match_all('/<script.*src="((?:main|utils|pubnub\-3\.1)\.js)".*><\/script>/i', $fc, $m);

    for ($i = 0; $i < count($m[0]); $i++)
    {
      $jsFile = $inputDir . '/' . $m[1][$i];
      $getJsCommandCurr = sprintf($getJsCommand, escapeshellcmd($jsFile));
      $jsFileContents = shell_exec($getJsCommandCurr);
      $fc = str_replace($m[0][$i], '<script type="text/javascript">' .
        $jsFileContents . '</script>', $fc);
    }

    // css
    $m = array();
    preg_match_all('/<link.*href=\"((?:main)\.css)\">/i', $fc, $m);

    for ($i = 0; $i < count($m[0]); $i++)
    {
      $cssFile = $inputDir . '/' . $m[1][$i];
      $getCssCommandCurr = sprintf($getCssCommand, escapeshellcmd($cssFile));

      $cssFileContents = shell_exec($getCssCommandCurr);
      $fc = str_replace($m[0][$i], '<style type="text/css">' .
        $cssFileContents . '</style>', $fc);
    }

    echo $fc;
  }
}