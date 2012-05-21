<?php

$inputDir = '../app/resources/images';
$scaleCmd = 'convert %s -resize 50%% %s';

$files = glob($inputDir . '/*@2x.png');

for ($i = 0; $i < count($files); $i++)
{
  $cmd = sprintf($scaleCmd, escapeshellarg($files[$i]), escapeshellarg(str_replace('@2x', '', $files[$i])));
  echo $cmd, "\n";
  echo shell_exec($cmd), "\n";
}